import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import Peer from "peerjs";
import { ActiveUser, Note, NoteStore, UserPresence } from "@/types/note";

const LOCAL_STORAGE_NOTES_KEY = "hardcoded-notes";

const generateCurrentUser = (): ActiveUser => {
  return {
    id: uuidv4(),
    name: `User-${Math.floor(Math.random() * 1000)}`,
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  };
};

const currentUser = generateCurrentUser();

const sampleNotes: Note[] = [
  {
    id: "sample-note-1",
    title: "Welcome to Collaborative Notes",
    content:
      "This is a sample note to help you get started. You can edit this note but not share it with others.",
    ownerId: "ME",
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    collaborators: [],
    version: 1,
    lastEditBy: "ME",
    isHardcoded: true,
  },
  {
    id: "sample-note-2",
    title: "How to Use This App",
    content:
      "1. Create a new note with the + button\n2. Edit your note in the editor\n3. Share notes with others (only for newly created notes)\n\nEnjoy collaborating!",
    ownerId: "ME",
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    collaborators: [],
    version: 1,
    lastEditBy: "ME",
    isHardcoded: true,
  },
  {
    id: "sample-note-3",
    title: "Features Overview",
    content:
      "- Real-time collaboration\n- Peer-to-peer sharing\n- Local storage\n- Version control\n\nNote: This is a sample note and cannot be shared.",
    ownerId: "ME",
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    collaborators: [],
    version: 1,
    lastEditBy: "ME",
    isHardcoded: true,
  },
];

const loadInitialNotes = (): Note[] => {
  try {
    const storedNotes = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
    if (storedNotes) {
      const parsedNotes = JSON.parse(storedNotes);
      return parsedNotes.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
        isHardcoded: true,
      }));
    }

    localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(sampleNotes));
    return sampleNotes;
  } catch (error) {
    console.error("Error loading notes from localStorage:", error);
    return sampleNotes;
  }
};

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: loadInitialNotes(),
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
      const userId = get().currentUser.id;

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
        const peer = await createPeer(userId);

        set((state) => ({
          currentUser: {
            ...state.currentUser,
            id: userId,
          },
          peer,
          isLoading: false,
        }));
      } catch (err) {
        console.warn("ID was taken, trying with random suffix");
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
                  note.ownerId === get().currentUser.id || note.collaborators.includes(conn.peer),
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
    const note = get().notes.find((note) => note.id === noteId);
    if (note && note.ownerId === "ME") {
      return;
    }

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
            notes: state.notes.map((note) => (note.id === data.noteId ? resolvedNote : note)),
            activeNote: state.activeNote?.id === data.noteId ? resolvedNote : state.activeNote,
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
            isHardcoded: false,
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
          const userNote = get().notes.find((note) => note.id === presenceData.noteId);
          if (userNote && userNote.ownerId === get().currentUser.id) {
            const userId = presenceData.user.id;
            if (!userNote.collaborators.includes(userId)) {
              set((state) => ({
                notes: state.notes.map((note) =>
                  note.id === presenceData.noteId
                    ? { ...note, collaborators: [...note.collaborators, userId] }
                    : note,
                ),
                activeNote:
                  state.activeNote?.id === presenceData.noteId
                    ? {
                        ...state.activeNote,
                        collaborators: [...state.activeNote.collaborators, userId],
                      }
                    : state.activeNote,
              }));
            }
          }
        } else {
          get().removeActiveUser(presenceData.user.id);
        }
        break;

      case "request-sync":
        const requestingUser = data.userId;
        const requestedNoteId = data.noteId;

        if (requestingUser) {
          const notesToShare = get().notes.filter(
            (note) =>
              note.id === requestedNoteId &&
              (note.ownerId === get().currentUser.id ||
                note.collaborators.includes(requestingUser)),
          );

          const conn = get().connections.get(requestingUser);
          if (conn && conn.open && notesToShare.length > 0) {
            conn.send({
              type: "initial-sync",
              notes: notesToShare,
            });
          }
        }
        break;

      case "note-delete":
        const deletedNoteId = data.noteId;
        if (deletedNoteId) {
          set((state) => ({
            notes: state.notes.filter((note) => note.id !== deletedNoteId),
            activeNote: state.activeNote?.id === deletedNoteId ? null : state.activeNote,
          }));
        }
        break;

      case "initial-sync":
        // Handle initial data sync
        const syncedNotes = data.notes || [];

        // Merge with existing notes
        set((state) => {
          const updatedNotes = [...state.notes];

          syncedNotes.forEach((syncedNote: Note) => {
            const existingNoteIndex = updatedNotes.findIndex((note) => note.id === syncedNote.id);

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
        content: remoteUpdate.content !== undefined ? remoteUpdate.content : localNote.content,
        title: remoteUpdate.title !== undefined ? remoteUpdate.title : localNote.title,
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
          content: remoteUpdate.content !== undefined ? remoteUpdate.content : localNote.content,
          title: remoteUpdate.title !== undefined ? remoteUpdate.title : localNote.title,
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

  broadcastNoteDelete: (noteId: string) => {
    const { connections } = get();
    connections.forEach((conn) => {
      if (conn.open) {
        conn.send({
          type: "note-delete",
          noteId,
          userId: get().currentUser.id,
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
    const noteId = uuidv4();

    const newNote: Note = {
      id: noteId,
      title,
      content,
      ownerId: get().currentUser.id,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      collaborators: [],
      version: 1,
      lastEditBy: get().currentUser.id,
      isHardcoded: false,
    };

    set((state) => ({
      notes: [...state.notes, newNote],
    }));

    return noteId;
  },

  updateNote: (id, updates) => {
    const note = get().notes.find((note) => note.id === id);
    if (!note) return;
    if (note.isHardcoded) {
      const updatedNote = {
        ...note,
        ...updates,
        updatedAt: updates.updatedAt || new Date(),
      };

      set((state) => ({
        notes: state.notes.map((note) => (note.id === id ? updatedNote : note)),
        activeNote: state.activeNote?.id === id ? updatedNote : state.activeNote,
      }));

      const hardcodedNotes = get().notes.filter((n) => n.isHardcoded);
      localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(hardcodedNotes));
      return;
    }

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
    const noteToDelete = get().notes.find((note) => note.id === id);
    if (!noteToDelete) return;

    if (noteToDelete.ownerId !== get().currentUser.id) {
      set({ error: "You don't have permission to delete this note" });
      return;
    }

    get().broadcastNoteDelete(id);

    noteToDelete.collaborators.forEach((collaboratorId) => {
      if (collaboratorId !== get().currentUser.id) {
        const conn = get().connections.get(collaboratorId);
        if (conn && conn.open) {
          conn.send({
            type: "note-delete",
            noteId: id,
            userId: get().currentUser.id,
          });

          const otherSharedNotes = get().notes.filter(
            (note) =>
              (note.id !== id &&
                note.ownerId === get().currentUser.id &&
                note.collaborators.includes(collaboratorId)) ||
              (note.ownerId === collaboratorId &&
                note.collaborators.includes(get().currentUser.id)),
          );

          if (otherSharedNotes.length === 0) {
            console.log(
              `Closing connection with ${collaboratorId} as there are no more shared notes`,
            );
            conn.close();
            set((state) => {
              const newConnections = new Map(state.connections);
              newConnections.delete(collaboratorId);
              return { connections: newConnections };
            });
          }
        }
      }
    });

    if (get().activeNote?.id === id) {
      get().broadcastPresence("leave", id);
      set({ activeNote: null });
    }

    set((state) => {
      const filteredNotes = state.notes.filter((note) => note.id !== id);
      return {
        notes: filteredNotes,
      };
    });
  },

  shareNote: (noteId, userId) => {
    const note = get().notes.find((note) => note.id === noteId);
    if (!note) return;
    if (note.isHardcoded) return;
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId ? { ...note, collaborators: [...note.collaborators, userId] } : note,
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
    const noteId = get().addNote(title, content) || "";

    if (noteId) {
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === noteId
            ? {
                ...note,
                isPlaceholder: false,
                ownerId: state.currentUser.id,
                lastEditBy: state.currentUser.id,
              }
            : note,
        ),
      }));
    }

    return noteId;
  },
}));
