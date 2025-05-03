import { RichTextEditor } from "@/components/rich-text-editor";
import { Input } from "@/components/ui/input";
import { useNoteStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import { debounce } from "lodash-es";
import { AlertCircle, Share2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import ShareNoteModal from "./share-note-modal";
import { Button } from "./ui/button";
import { ActiveUser } from "@/types/note";

interface NoteEditorProps {
  noteId: string;
}

const NoteEditor = ({ noteId }: NoteEditorProps) => {
  const {
    activeNote,
    setActiveNote,
    currentUser,
    activeUsers,
    updateNote,
    peer,
    initializePeer,
    error,
  } = useNoteStore();
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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
            >
              <Share2 size={16} className="mr-1" />
              Share
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from(activeUsers.values()).map((user: ActiveUser) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-1 px-2 py-1 rounded-full text-sm"
                  style={{ backgroundColor: user.color + "20" }}
                  title={`${user.name} is currently viewing this note`}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: user.color }} />
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center mt-1 text-sm text-gray-500">
          <span>
            Last edited:{" "}
            {formatDistanceToNow(new Date(activeNote.updatedAt), {
              addSuffix: true,
            })}
            {activeNote.lastEditBy && activeNote.lastEditBy !== currentUser.id && (
              <span>
                {" "}
                by{" "}
                {Array.from(activeUsers.values()).find((u) => u.id === activeNote.lastEditBy)
                  ?.name || "another user"}
              </span>
            )}
          </span>
          {isEditing && (
            <span className="ml-2 text-blue-500 flex items-center">
              <span className="animate-pulse mr-1">●</span> Editing...
            </span>
          )}
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-50 text-red-800 rounded-md flex items-center">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
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
