import { useNoteStore } from "@/lib/store";
import { Check, Copy, Share2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Note } from "@/types/note";

interface ShareNoteModalProps {
  note: Note | null;
  onClose: () => void;
}

const ShareNoteModal = ({ note, onClose }: ShareNoteModalProps) => {
  const { currentUser } = useNoteStore();
  const [copied, setCopied] = useState(false);

  if (!note) return null;

  const copyShareInfo = () => {
    if (note) {
      const shareText = `noteId:${note.id}\npeerId:${note.ownerId}`;
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
            <Share2 className="mr-2" size={20} />
            Share Note
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
          <h3 className="text-sm font-medium mb-1">Note Information</h3>
          <div className="bg-muted p-3 rounded text-sm mb-2">
            <div className="font-semibold">Title: {note.title}</div>
            <div className="text-xs mt-1">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Note ID:</span>
                <code className="bg-black/5 px-1 rounded">{note.id}</code>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-muted-foreground">Peer ID:</span>
                <code className="bg-black/5 px-1 rounded">{note.ownerId}</code>
              </div>
            </div>
          </div>

          <div className="flex mt-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyShareInfo}
              className="text-xs flex items-center flex-1"
            >
              {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
              {copied ? "Copied!" : "Copy Share Info"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Others will need both the Note ID and Peer ID to join. The copied format can be directly
            pasted into the Join Note dialog.
          </p>
        </div>

        {note.collaborators.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-1">Current Collaborators</h3>
            <div className="bg-muted p-2 rounded">
              <ul className="list-disc list-inside text-sm">
                {note.collaborators.map((id) => (
                  <li key={id} className="py-1">
                    {id === currentUser.id ? `${id} (you)` : id}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareNoteModal;
