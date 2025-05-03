import React, { useState, useEffect } from "react";
import { X, LogIn, Clipboard } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useNoteStore } from "@/lib/store";

interface JoinNoteModalProps {
  onClose: () => void;
}

const JoinNoteModal = ({ onClose }: JoinNoteModalProps) => {
  const [noteId, setNoteId] = useState("");
  const [peerId, setPeerId] = useState("");
  const [error, setError] = useState("");
  const { notes, connectToPeer } = useNoteStore();

  const handlePaste = (e: React.ClipboardEvent) => {
    const clipText = e.clipboardData.getData("text");
    if (clipText.includes("noteId:") && clipText.includes("peerId:")) {
      e.preventDefault();

      try {
        const noteIdMatch = clipText.match(/noteId:(.*?)(\n|$)/);
        const peerIdMatch = clipText.match(/peerId:(.*?)(\n|$)/);

        if (noteIdMatch && noteIdMatch[1]) {
          setNoteId(noteIdMatch[1].trim());
        }

        if (peerIdMatch && peerIdMatch[1]) {
          setPeerId(peerIdMatch[1].trim());
        }

        setError("");
      } catch (err) {
        setError("Failed to parse clipboard content. Please paste the values manually.");
      }
    }
  };

  const tryReadClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();

        if (clipText.includes("noteId:") && clipText.includes("peerId:")) {
          const noteIdMatch = clipText.match(/noteId:(.*?)(\n|$)/);
          const peerIdMatch = clipText.match(/peerId:(.*?)(\n|$)/);

          if (noteIdMatch && noteIdMatch[1]) {
            setNoteId(noteIdMatch[1].trim());
          }

          if (peerIdMatch && peerIdMatch[1]) {
            setPeerId(peerIdMatch[1].trim());
          }
        }
      }
    } catch (err) {
      console.log("Clipboard auto-reading not available", err);
    }
  };

  useEffect(() => {
    tryReadClipboard();
  }, []);

  const handleJoinNote = () => {
    if (!noteId.trim()) {
      setError("Please enter a note ID");
      return;
    }

    if (!peerId.trim()) {
      setError("Please enter the peer ID of the note owner");
      return;
    }

    const existingNote = notes.find((note) => note.id === noteId);
    if (existingNote) {
      useNoteStore.getState().setActiveNote(existingNote);
      onClose();
      return;
    }

    try {
      connectToPeer(peerId, noteId);
      onClose();
    } catch (err) {
      setError("Failed to connect. Please check the IDs and try again.");
    }
  };

  const handlePasteFromClipboard = async () => {
    await tryReadClipboard();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <LogIn className="mr-2" size={20} />
            Join Note
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Enter the note ID and peer ID to join a collaborative editing session.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePasteFromClipboard}
              className="flex items-center gap-1 text-xs"
              title="Paste from clipboard"
            >
              <Clipboard size={14} />
              Paste
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Note ID</label>
              <Input
                placeholder="Enter note ID"
                value={noteId}
                onChange={(e) => {
                  setNoteId(e.target.value);
                  setError("");
                }}
                onPaste={handlePaste}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Peer ID (Note Owner's ID)</label>
              <Input
                placeholder="Enter peer ID"
                value={peerId}
                onChange={(e) => {
                  setPeerId(e.target.value);
                  setError("");
                }}
                onPaste={handlePaste}
                className="w-full"
              />
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleJoinNote}>Join Note</Button>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> You can copy the note ID and peer ID from the person who shared
            the note with you. If you've copied the share info, it will be automatically filled in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinNoteModal;
