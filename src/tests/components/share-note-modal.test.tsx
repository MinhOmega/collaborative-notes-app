import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { render } from "../test-utils";
import ShareNoteModal from "@/components/share-note-modal";
import { mockNotes } from "../mocks/store-mock";

const mockClipboard = {
  writeText: vi.fn(() => {
    return Promise.resolve();
  }),
  readText: vi.fn(),
};

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: mockClipboard,
    configurable: true,
  });

  vi.clearAllMocks();
});

const originalHref = window.location.href;
const originalOrigin = window.location.origin;

beforeEach(() => {
  Object.defineProperty(window, "location", {
    value: {
      href: "http://localhost:5173",
      origin: "http://localhost:5173",
    },
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: {
      href: originalHref,
      origin: originalOrigin,
    },
    configurable: true,
  });
});

describe("ShareNoteModal Component", () => {
  it("renders the share modal with correct note info", () => {
    const onClose = vi.fn();
    render(<ShareNoteModal note={mockNotes[0]} onClose={onClose} />);

    expect(screen.getByText("Share Note")).toBeInTheDocument();

    expect(screen.getByText(/Title:/)).toBeInTheDocument();
    expect(screen.getByText(/Test Note 1/)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Copy Share Info/i })).toBeInTheDocument();
  });

  it("copies the link to clipboard when the copy button is clicked", async () => {
    const onClose = vi.fn();
    render(<ShareNoteModal note={mockNotes[0]} onClose={onClose} />);

    const copyButton = screen.getByRole("button", { name: /Copy Share Info/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it("closes the modal when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<ShareNoteModal note={mockNotes[0]} onClose={onClose} />);

    const closeButton = screen.getByRole("button", { name: /Close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("handles hardcoded notes correctly", () => {
    const onClose = vi.fn();
    render(<ShareNoteModal note={mockNotes[1]} onClose={onClose} />);

    expect(screen.getByText(/Test Note 2/)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Copy Share Info/i })).toBeInTheDocument();
  });
});
