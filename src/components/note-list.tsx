import { Button } from "@/components/ui/button";
import { useNoteStore } from "@/lib/store";
import { Note } from "@/types/note";
import { Plus } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NoteListItem from "./note-list-item";

interface NoteListProps {
  onNoteSelect?: () => void;
}

const NoteList = ({ onNoteSelect }: NoteListProps) => {
  const { notes, activeNote, setActiveNote, addNote, deleteNote } = useNoteStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const filteredNotes = useMemo(() => {
    if (!debouncedSearchTerm) return notes;

    const term = debouncedSearchTerm.toLowerCase();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(term) || note.content.toLowerCase().includes(term),
    );
  }, [notes, debouncedSearchTerm]);

  const handleDeleteNote = useCallback(
    (noteId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      deleteNote(noteId);
    },
    [deleteNote],
  );

  const handleNoteClick = useCallback(
    (note: Note) => {
      setActiveNote(note);
      if (onNoteSelect) {
        onNoteSelect();
      }
    },
    [setActiveNote, onNoteSelect],
  );

  const handleAddNote = useCallback(() => {
    addNote("Untitled Note", "");
  }, [addNote]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <Button onClick={handleAddNote} className="w-full flex items-center justify-center gap-2">
          <Plus size={16} /> New Note
        </Button>
      </div>

      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search notes..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length > 0 ? (
          <NoteListItem
            notes={filteredNotes}
            activeNoteId={activeNote?.id}
            handleNoteClick={handleNoteClick}
            handleDeleteNote={handleDeleteNote}
          />
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No notes found. Create a new one!
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(NoteList);
