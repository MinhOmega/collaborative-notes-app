import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import Peer from "peerjs";
import { ActiveUser, Note, NoteStore, UserPresence } from "@/types/note";

const generateCurrentUser = (): ActiveUser => {
  return {
    id: uuidv4(),
    name: `User-${Math.floor(Math.random() * 1000)}`,
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  };
};

const currentUser = generateCurrentUser();

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  activeNote: null,
  activeUsers: new Map(),
  currentUser,
  isLoading: false,
  error: null,
  peer: null,
  connections: new Map(),

  initializePeer: async () => {
    try {
      set({ isLoading: true });
      const shorterId = get().currentUser.id.split("-")[0];

      const createPeer = (id: string): Promise<Peer> => {
        return new Promise((resolve, reject) => {
          const newPeer = new Peer(id);

          newPeer.on("open", () => {
            console.log("Connected to PeerJS server with ID:", id);
            resolve(newPeer);
          });

          newPeer.on("error", (err) => {
            if (err.message && err.message.includes("is taken")) {
              reject(err);
            } else {
              console.error("PeerJS error:", err);
              set({ error: err.message });
              resolve(newPeer);
            }
          });
        });
      };

      try {
        const peer = await createPeer(shorterId);

        set((state) => ({
          currentUser: {
            ...state.currentUser,
            id: shorterId,
          },
          peer,
          isLoading: false,
        }));
      } catch (err) {
        console.warn("ID was taken, trying with random suffix");
        const randomSuffix = Math.floor(Math.random() * 10000);
        const alternativeId = `${shorterId}_${randomSuffix}`;

        try {
          const peer = await createPeer(alternativeId);

          set((state) => ({
            currentUser: {
              ...state.currentUser,
              id: alternativeId,
            },
            peer,
            isLoading: false,
          }));
        } catch (secondError) {
          console.warn("Alternative ID also taken, using full UUID");
          const peer = await createPeer(get().currentUser.id);
          set({ peer, isLoading: false });
        }
      }

      const peer = get().peer;
      if (peer) {
        peer.on("connection", (conn: any) => {
          conn.on("open", () => {
            set((state) => ({
              connections: new Map(state.connections).set(conn.peer, conn),
              error: null,
            }));
            conn.send({
              type: "initial-sync",
              notes: get().notes.filter(
                (note) =>
                  note.ownerId === get().currentUser.id ||
                  note.collaborators.includes(conn.peer),
              ),
            });
            conn.on("data", (data: any) => {
              get().handleIncomingData(data);
            });
            conn.on("close", () => {
              set((state) => {
                const newConnections = new Map(state.connections);
                newConnections.delete(conn.peer);
                return { connections: newConnections };
              });
              get().removeActiveUser(conn.peer);
            });
          });
        });
      }
    } catch (error) {
      console.error("Failed to initialize PeerJS:", error);
      set({
        error: "Failed to initialize peer-to-peer connection",
        isLoading: false,
      });
    }
  },

  connectToPeer: (peerId, noteId) => {
    const { peer, connections, currentUser } = get();
    if (!peer) {
      set({ error: "PeerJS not initialized. Try refreshing the page." });
      return;
    }
    if (connections.has(peerId)) return;
    const conn = peer.connect(peerId);
    if (!conn) {
      set({ error: `Failed to connect to peer: ${peerId}` });
      return;
    }
    conn.on("open", () => {
      set((state) => ({
        connections: new Map(state.connections).set(peerId, conn),
        error: null,
      }));
      conn.send({
        type: "presence",
        action: "join",
        noteId,
        user: currentUser,
      });
      conn.on("data", (data: any) => {
        get().handleIncomingData(data);
      });
    });

    conn.on("error", (err: any) => {
      console.error("Connection error:", err);
      set({ error: `Connection error: ${err.message || "Unknown error"}` });
      set((state) => {
        const newConnections = new Map(state.connections);
        newConnections.delete(peerId);
        return { connections: newConnections };
      });
    });
    conn.on("close", () => {
      set((state) => {
        const newConnections = new Map(state.connections);
        newConnections.delete(peerId);
        return { connections: newConnections };
      });
    });
  },

  // Handle incoming data from peers
  handleIncomingData: (data) => {
    if (!data.type) return;

    switch (data.type) {
      case "note-update":
        // Handle note update
        const localNote = get().notes.find((note) => note.id === data.noteId);

        if (localNote) {
          // Resolve conflicts if needed
          const resolvedNote = get().resolveConflict(localNote, data);

          // Update local state
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === data.noteId ? resolvedNote : note,
            ),
            activeNote:
              state.activeNote?.id === data.noteId
                ? resolvedNote
                : state.activeNote,
          }));
        } else {
          // Add new note if we don't have it
          const newNote: Note = {
            id: data.noteId,
            title: data.title || "Shared Note",
            content: data.content || "",
            ownerId: data.userId,
            isPublic: true,
            createdAt: new Date(),
            updatedAt: data.updatedAt,
            collaborators: [get().currentUser.id],
            version: data.version,
            lastEditBy: data.userId,
          };

          set((state) => ({
            notes: [...state.notes, newNote],
          }));
        }
        break;

      case "presence":
        // Handle user presence
        const presenceData = data as UserPresence;

        if (presenceData.action === "join") {
          get().addActiveUser(presenceData.user, presenceData.noteId);
        } else {
          get().removeActiveUser(presenceData.user.id);
        }
        break;

      case "initial-sync":
        // Handle initial data sync
        const syncedNotes = data.notes || [];

        // Merge with existing notes
        set((state) => {
          const updatedNotes = [...state.notes];

          syncedNotes.forEach((syncedNote: Note) => {
            const existingNoteIndex = updatedNotes.findIndex(
              (note) => note.id === syncedNote.id,
            );

            if (existingNoteIndex >= 0) {
              // Resolve conflict for existing note
              updatedNotes[existingNoteIndex] = get().resolveConflict(
                updatedNotes[existingNoteIndex],
                {
                  noteId: syncedNote.id,
                  content: syncedNote.content,
                  title: syncedNote.title,
                  updatedAt: syncedNote.updatedAt,
                  version: syncedNote.version,
                  userId: syncedNote.lastEditBy,
                },
              );
            } else {
              // Add new note
              updatedNotes.push(syncedNote);
            }
          });

          return { notes: updatedNotes };
        });
        break;

      default:
        console.warn("Unknown data type received:", data.type);
    }
  },

  // Resolve conflicts with remote updates
  resolveConflict: (localNote, remoteUpdate) => {
    // Simple version-based conflict resolution. Higher version wins, if versions are equal, most recent update wins
    if (remoteUpdate.version > localNote.version) {
      // Remote version is newer, accept remote changes
      return {
        ...localNote,
        content:
          remoteUpdate.content !== undefined
            ? remoteUpdate.content
            : localNote.content,
        title:
          remoteUpdate.title !== undefined
            ? remoteUpdate.title
            : localNote.title,
        updatedAt: remoteUpdate.updatedAt,
        version: remoteUpdate.version,
        lastEditBy: remoteUpdate.userId,
      };
    } else if (remoteUpdate.version === localNote.version) {
      // Same version, compare timestamps
      const localTime =
        localNote.updatedAt instanceof Date
          ? localNote.updatedAt.getTime()
          : new Date(localNote.updatedAt).getTime();

      const remoteTime =
        remoteUpdate.updatedAt instanceof Date
          ? remoteUpdate.updatedAt.getTime()
          : new Date(remoteUpdate.updatedAt).getTime();

      if (remoteTime > localTime) {
        // Remote is more recent, accept remote changes
        return {
          ...localNote,
          content:
            remoteUpdate.content !== undefined
              ? remoteUpdate.content
              : localNote.content,
          title:
            remoteUpdate.title !== undefined
              ? remoteUpdate.title
              : localNote.title,
          updatedAt: remoteUpdate.updatedAt,
          version: remoteUpdate.version,
          lastEditBy: remoteUpdate.userId,
        };
      }
    }

    // Keep local version
    return localNote;
  },

  broadcastUpdate: (update) => {
    const { connections } = get();
    connections.forEach((conn) => {
      if (conn.open) {
        conn.send({
          type: "note-update",
          ...update,
        });
      }
    });
  },

  broadcastPresence: (action, noteId) => {
    const { connections, currentUser } = get();

    connections.forEach((conn) => {
      if (conn.open) {
        conn.send({
          type: "presence",
          action,
          noteId,
          user: currentUser,
        });
      }
    });
  },

  setActiveNote: (note) => {
    const prevNoteId = get().activeNote?.id;
    set({ activeNote: note });

    if (prevNoteId && prevNoteId !== note?.id) {
      get().broadcastPresence("leave", prevNoteId);
    }

    if (note) {
      get().broadcastPresence("join", note.id);

      note.collaborators.forEach((userId) => {
        if (userId !== get().currentUser.id) {
          get().connectToPeer(userId, note.id);
        }
      });

      if (note.ownerId !== get().currentUser.id) {
        get().connectToPeer(note.ownerId, note.id);
      }
    }
  },

  addNote: (title, content) => {
    const newNote: Note = {
      id: uuidv4(),
      title,
      content,
      ownerId: get().currentUser.id,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      collaborators: [],
      version: 1,
      lastEditBy: get().currentUser.id,
    };

    set((state) => ({
      notes: [...state.notes, newNote],
    }));
  },

  updateNote: (id, updates) => {
    const note = get().notes.find((note) => note.id === id);
    if (!note) return;

    const updatedAt = new Date();
    const newVersion = note.version + 1;

    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? {
              ...note,
              ...updates,
              updatedAt,
              version: newVersion,
              lastEditBy: get().currentUser.id,
            }
          : note,
      ),
      activeNote:
        state.activeNote?.id === id
          ? {
              ...state.activeNote,
              ...updates,
              updatedAt,
              version: newVersion,
              lastEditBy: get().currentUser.id,
            }
          : state.activeNote,
    }));

    get().broadcastUpdate({
      noteId: id,
      ...updates,
      updatedAt,
      version: newVersion,
      userId: get().currentUser.id,
    });
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      activeNote: state.activeNote?.id === id ? null : state.activeNote,
    }));
  },

  shareNote: (noteId, userId) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId
          ? { ...note, collaborators: [...note.collaborators, userId] }
          : note,
      ),
    }));

    get().connectToPeer(userId, noteId);
  },

  unshareNote: (noteId, userId) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              collaborators: note.collaborators.filter((id) => id !== userId),
            }
          : note,
      ),
    }));
  },

  addActiveUser: (user, noteId) => {
    if (get().activeNote?.id !== noteId) return;

    set((state) => ({
      activeUsers: new Map(state.activeUsers).set(user.id, user),
    }));
  },

  removeActiveUser: (userId) => {
    set((state) => {
      const newActiveUsers = new Map(state.activeUsers);
      newActiveUsers.delete(userId);
      return { activeUsers: newActiveUsers };
    });
  },

  syncNoteContent: (noteId, content) => {
    get().updateNote(noteId, { content });
  },

  createNote: () => {
    const title = "Untitled Note";
    const content = "";
    get().addNote(title, content);
  },
}));

export const initializeUserFingerprint = async () => {
  try {
    const USER_ID_KEY = "user-fingerprint-id";
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = uuidv4();
      localStorage.setItem(USER_ID_KEY, userId);
    }

    if (useNoteStore.getState().currentUser.id !== userId) {
      useNoteStore.setState((state) => ({
        currentUser: {
          ...state.currentUser,
          id: userId,
        },
      }));
    }

    useNoteStore.getState().initializePeer();
  } catch (error) {
    console.error("Have some issue in initializeUserFingerprint", error);
  }
};
