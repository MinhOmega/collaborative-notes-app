import React, { useState, useMemo } from "react";
import { useNoteStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note } from "@/types/note";

const NoteList = () => {
  const { notes, activeNote, setActiveNote, addNote, deleteNote } =
    useNoteStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNotes = useMemo(() => {
    if (!searchTerm) return notes;

    const term = searchTerm.toLowerCase();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(term) ||
        note.content.toLowerCase().includes(term),
    );
  }, [notes, searchTerm]);

  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote(noteId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <Button
          onClick={() => addNote("Untitled Note", "")}
          className="w-full flex items-center justify-center gap-2"
        >
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
          <div className="divide-y">
            {filteredNotes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                isActive={activeNote?.id === note.id}
                onClick={() => setActiveNote(note)}
                onDelete={(e) => handleDeleteNote(note.id, e)}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No notes found. Create a new one!
          </div>
        )}
      </div>
    </div>
  );
};

interface NoteListItemProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const NoteListItem = ({
  note,
  isActive,
  onClick,
  onDelete,
}: NoteListItemProps) => {
  const contentPreview = note.content
    .replace(/<[^>]*>/g, "")
    .slice(0, 50)
    .trim();

  const updatedTime = note.updatedAt
    ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })
    : "recently";

  return (
    <div
      className={cn(
        "p-3 cursor-pointer hover:bg-secondary/50 relative group",
        isActive && "bg-secondary",
      )}
      onClick={onClick}
    >
      <h3 className="font-medium truncate">{note.title}</h3>

      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
        {contentPreview || "Empty note..."}
      </p>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">{updatedTime}</span>
        {note.collaborators && note.collaborators.length > 0 && (
          <div className="flex -space-x-2">
            <div className="w-5 h-5 rounded-full border-2 border-background flex items-center justify-center text-[8px] bg-muted">
              +{note.collaborators.length}
            </div>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
};

export default NoteList;
