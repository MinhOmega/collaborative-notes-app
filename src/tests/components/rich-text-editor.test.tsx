import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import { RichTextEditor } from "@/components/rich-text-editor";
import { mockCurrentUser } from "../mocks/store-mock";

vi.mock("@tiptap/react", () => {
  const mockChainReturn = {
    focus: vi.fn().mockReturnThis(),
    toggleBold: vi.fn().mockReturnThis(),
    toggleItalic: vi.fn().mockReturnThis(),
    toggleMark: vi.fn().mockReturnThis(),
    toggleBulletList: vi.fn().mockReturnThis(),
    toggleOrderedList: vi.fn().mockReturnThis(),
    run: vi.fn().mockReturnValue(true),
  };

  return {
    EditorContent: vi.fn(({ editor }) => (
      <div data-testid="editor-content">
        <div>Mocked Editor Content</div>
        <div>{editor?.isActive ? "Active" : "Not Active"}</div>
      </div>
    )),
    useEditor: vi.fn(() => ({
      isActive: vi.fn().mockReturnValue(false),
      chain: vi.fn().mockReturnValue(mockChainReturn),
      can: vi.fn().mockReturnValue({
        chain: vi.fn().mockReturnValue(mockChainReturn),
      }),
      commands: {
        setContent: vi.fn(),
      },
      getHTML: vi.fn().mockReturnValue("<p>Test Content</p>"),
    })),
  };
});

vi.mock("@tiptap/extension-underline", () => ({ default: {} }));
vi.mock("@tiptap/starter-kit", () => ({ default: { configure: vi.fn().mockReturnValue({}) } }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RichTextEditor Component", () => {
  it("renders the editor", () => {
    render(
      <RichTextEditor
        content="<p>Test content</p>"
        noteId="note-1"
        currentUser={mockCurrentUser}
      />,
    );

    expect(screen.getByTestId("editor-content")).toBeInTheDocument();

    expect(screen.getByLabelText("Bold")).toBeInTheDocument();
  });

  it("shows the online status", () => {
    render(
      <RichTextEditor
        content="<p>Test content</p>"
        noteId="note-1"
        currentUser={mockCurrentUser}
      />,
    );

    expect(screen.getByText("Online")).toBeInTheDocument();
  });
});
