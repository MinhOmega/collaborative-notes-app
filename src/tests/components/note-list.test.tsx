import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import NoteList from "@/components/note-list";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NoteList Component", () => {
  it("renders basic elements", () => {
    render(<NoteList />);

    expect(screen.getByText("New Note")).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Search notes...")).toBeInTheDocument();
  });
});
