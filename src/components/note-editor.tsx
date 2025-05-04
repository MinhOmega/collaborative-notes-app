import { RichTextEditor } from "@/components/rich-text-editor";
import { Input } from "@/components/ui/input";
import { useNoteStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import { debounce } from "lodash-es";
import { AlertCircle, Share2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ShareNoteModal from "./share-note-modal";
import { Button } from "./ui/button";

interface NoteEditorProps {
  noteId: string;
}

const NoteEditor = ({ noteId }: NoteEditorProps) => {
  const { activeNote, setActiveNote, currentUser, activeUsers, updateNote, error } = useNoteStore();
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const nameOfLastEdit = useMemo(() => {
    if (activeNote?.ownerId === "ME") {
      return "me";
    }
    const activeUsersList = Array.from(activeUsers.values());
    if (activeNote?.lastEditBy === currentUser?.id) {
      return "me";
    } else if (activeNote?.lastEditBy === activeNote?.ownerId) {
      return "owner note";
    }
    return activeUsersList.find((u) => u.id === activeNote?.lastEditBy)?.name || "another user";
  }, [activeNote, activeUsers]);

  useEffect(() => {
    if (noteId) {
      const note = useNoteStore.getState().notes.find((n) => n.id === noteId);
      if (note) {
        setActiveNote(note);
      }
    }
  }, [noteId, setActiveNote]);

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
    }
  }, [activeNote]);

  const debouncedUpdateTitle = useCallback(
    debounce((value: string) => {
      if (activeNote) {
        updateNote(activeNote.id, { title: value });
        setIsEditing(false);
      }
    }, 800),
    [activeNote, updateNote],
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setIsEditing(true);
    debouncedUpdateTitle(newTitle);
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  if (!activeNote) {
    return (
      <div className="flex justify-center items-center h-full">
        Select a note or create a new one
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Input
              value={title}
              onChange={handleTitleChange}
              className="text-2xl font-bold border-none px-0 hover:bg-gray-100 focus:bg-gray-100 focus:ring-0 h-auto py-1 transition-colors duration-200 p-2"
              aria-label="Note title"
            />
          </div>

          <div className="flex items-center ml-4 space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareClick}
              className="flex items-center"
              disabled={activeNote?.isHardcoded}
              title={activeNote?.isHardcoded ? "Sample notes cannot be shared" : "Share note"}
            >
              <Share2 size={16} className="mr-1" />
              Share
            </Button>
          </div>
        </div>

        <div className="flex items-center mt-2 text-sm text-gray-500">
          <span>
            Last edited:{" "}
            {formatDistanceToNow(new Date(activeNote.updatedAt), {
              addSuffix: true,
            })}
          </span>
          <span className="ml-1">by {nameOfLastEdit}</span>

          {isEditing && (
            <span className="ml-2 text-blue-500 flex items-center">
              <span className="animate-pulse mr-1">●</span> Editing...
            </span>
          )}
          {activeNote.isHardcoded && (
            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-xs">
              Sample Note
            </span>
          )}
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-50 text-red-800 rounded-md flex items-center">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {activeNote.isHardcoded && (
          <div className="mt-2 p-2 bg-amber-50 text-amber-800 rounded-md flex items-center text-sm">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            This is a sample note. Your changes will be saved locally but you cannot share it with
            others.
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">
        <RichTextEditor
          content={activeNote.content}
          noteId={activeNote.id}
          currentUser={currentUser}
        />
      </div>

      {showShareModal && (
        <ShareNoteModal note={activeNote} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
};

export default NoteEditor;
