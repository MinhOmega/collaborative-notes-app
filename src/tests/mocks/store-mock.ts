import { vi } from "vitest";
import { Note } from "@/types/note";

export const mockNotes: Note[] = [
  {
    id: "note-1",
    title: "Test Note 1",
    content: "<p>This is test note 1 content</p>",
    createdAt: new Date("2023-10-10T10:00:00.000Z"),
    updatedAt: new Date("2023-10-10T10:30:00.000Z"),
    ownerId: "ME",
    lastEditBy: "ME",
    isHardcoded: false,
    isPublic: true,
    collaborators: [],
    version: 1,
  },
  {
    id: "note-2",
    title: "Test Note 2",
    content: "<p>This is test note 2 content</p>",
    createdAt: new Date("2023-10-11T10:00:00.000Z"),
    updatedAt: new Date("2023-10-11T10:30:00.000Z"),
    ownerId: "USER-123",
    lastEditBy: "ME",
    isHardcoded: true,
    isPublic: false,
    collaborators: [],
    version: 1,
  },
];

export const mockCurrentUser = {
  id: "user-1",
  name: "Test User",
  color: "#ff5733",
};

export const mockActiveUsers = new Map([
  ["user-1", mockCurrentUser],
  [
    "user-2",
    {
      id: "user-2",
      name: "Another User",
      color: "#33ff57",
    },
  ],
]);

export const mockUseNoteStore = {
  notes: mockNotes,
  activeNote: mockNotes[0],
  setActiveNote: vi.fn(),
  addNote: vi.fn(),
  deleteNote: vi.fn(),
  updateNote: vi.fn(),
  syncNoteContent: vi.fn(),
  error: null,
  currentUser: mockCurrentUser,
  activeUsers: mockActiveUsers,
  initializePeer: vi.fn(),
  createNote: vi.fn(),
  connectToPeer: vi.fn(),
  addActiveUser: vi.fn(),
  removeActiveUser: vi.fn(),
  isLoading: false,
  peer: null,
  connections: new Map(),
  broadcastUpdate: vi.fn(),
  broadcastPresence: vi.fn(),
  broadcastNoteDelete: vi.fn(),
  handleIncomingData: vi.fn(),
  resolveConflict: vi.fn(),
  unshareNote: vi.fn(),
};

vi.mock("@/lib/store", () => ({
  useNoteStore: vi.fn(() => mockUseNoteStore),
}));
