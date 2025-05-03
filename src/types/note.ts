import Peer from "peerjs";

export interface ActiveUser {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  collaborators: string[];
  version: number;
  lastEditBy: string;
  isHardcoded: boolean;
}

export interface NoteUpdate {
  noteId: string;
  content?: string;
  title?: string;
  updatedAt: Date;
  version: number;
  userId: string;
}

export interface UserPresence {
  type: "presence";
  user: ActiveUser;
  noteId: string;
  action: "join" | "leave";
}

export interface UserPresence {
  type: "presence";
  user: ActiveUser;
  noteId: string;
  action: "join" | "leave";
}

export interface NoteStore {
  notes: Note[];
  activeNote: Note | null;
  activeUsers: Map<string, ActiveUser>;
  currentUser: ActiveUser;
  isLoading: boolean;
  error: string | null;
  peer: Peer | null;
  connections: Map<string, any>;

  // Actions
  setActiveNote: (note: Note | null) => void;
  addNote: (title: string, content: string) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  shareNote: (noteId: string, userId: string) => void;
  unshareNote: (noteId: string, userId: string) => void;
  createNote: () => string;

  // Real-time actions
  addActiveUser: (user: ActiveUser, noteId: string) => void;
  removeActiveUser: (userId: string) => void;
  syncNoteContent: (noteId: string, content: string) => void;

  // PeerJS specific actions
  initializePeer: () => Promise<void>;
  connectToPeer: (peerId: string, noteId: string) => void;
  broadcastUpdate: (update: NoteUpdate) => void;
  broadcastPresence: (action: "join" | "leave", noteId: string) => void;
  broadcastNoteDelete: (noteId: string) => void;
  handleIncomingData: (data: any) => void;
  resolveConflict: (localNote: Note, remoteUpdate: NoteUpdate) => Note;
}
