import NoteEditor from "@/components/note-editor";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockUseNoteStore } from "../mocks/store-mock";
import { render } from "../test-utils";

vi.mock("@/components/rich-text-editor", () => ({
  RichTextEditor: vi.fn(() => <div data-testid="rich-text-editor">Mock Rich Text Editor</div>),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NoteEditor Component", () => {
  it("renders empty state when no note is active", () => {
    const originalActiveNote = mockUseNoteStore.activeNote;
    mockUseNoteStore.activeNote = null as any;

    render(<NoteEditor noteId="non-existent-id" />);

    expect(screen.getByText("Select a note or create a new one")).toBeInTheDocument();

    mockUseNoteStore.activeNote = originalActiveNote;
  });
});
