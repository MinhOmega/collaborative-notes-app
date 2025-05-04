import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Note } from "@/types/note";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BATCH_SIZE = 20;
interface NoteListItemProps {
  notes: Note[];
  activeNoteId: string | undefined;
  handleNoteClick: (note: Note) => void;
  handleDeleteNote: (noteId: string, e: React.MouseEvent) => void;
}

interface MemoizedNoteListItemProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const MemoizedNoteListItem = React.memo(
  ({ note, isActive, onClick, onDelete }: MemoizedNoteListItemProps) => {
    const isMobile = useIsMobile();
    const contentPreview = useMemo(
      () =>
        note.content
          .replace(/<[^>]*>/g, "")
          .slice(0, 50)
          .trim(),
      [note.content],
    );

    const updatedTime = useMemo(
      () =>
        note.updatedAt
          ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })
          : "recently",
      [note.updatedAt],
    );

    return (
      <div
        className={cn(
          "p-3 cursor-pointer hover:bg-secondary/50 relative group",
          isActive && "bg-secondary",
          note.isHardcoded && "border-l-4 border-amber-300",
        )}
        onClick={onClick}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-medium truncate pr-8">{note.title}</h3>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "right-2 top-2",
              isMobile
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 transition-opacity absolute",
            )}
            onClick={onDelete}
            aria-label="Delete note"
          >
            <Trash2 size={16} />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {contentPreview || "Empty note..."}
        </p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{updatedTime}</span>

            {note.isHardcoded && (
              <span className="ml-1 text-xs px-1 bg-amber-100 text-amber-800 rounded">Sample</span>
            )}
          </div>

          {note.collaborators && note.collaborators.length > 0 && !note.isHardcoded && (
            <div className="flex -space-x-2">
              <div className="w-5 h-5 rounded-full border-2 border-background flex items-center justify-center text-[8px] bg-muted">
                +{note.collaborators.length}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.note.id === nextProps.note.id &&
      prevProps.note.title === nextProps.note.title &&
      prevProps.note.content === nextProps.note.content &&
      prevProps.note.updatedAt === nextProps.note.updatedAt &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.note.collaborators?.length === nextProps.note.collaborators?.length
    );
  },
);

MemoizedNoteListItem.displayName = "MemoizedNoteListItem";

const NoteListItem = ({
  notes,
  activeNoteId,
  handleNoteClick,
  handleDeleteNote,
}: NoteListItemProps) => {
  const [visibleNotes, setVisibleNotes] = useState<Note[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const loadingRef = useRef<HTMLDivElement>(null);

  const loadMoreNotes = useCallback(() => {
    if (isLoading || visibleNotes.length >= notes.length) return;

    setIsLoading(true);

    setTimeout(() => {
      const end = page * BATCH_SIZE;
      const newNotes = notes.slice(0, end);

      setVisibleNotes(newNotes);
      setPage(page + 1);
      setIsLoading(false);
    }, 100);
  }, [isLoading, notes, page, visibleNotes.length]);

  useEffect(() => {
    setVisibleNotes(notes.slice(0, BATCH_SIZE));
    setPage(2);
  }, [notes]);

  useEffect(() => {
    if (!loadingRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          loadMoreNotes();
        }
      },
      { root: containerRef.current, threshold: 0.1 },
    );

    observerRef.current.observe(loadingRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreNotes]);

  return (
    <div ref={containerRef} className="divide-y overflow-auto h-full">
      {visibleNotes.map((note) => (
        <MemoizedNoteListItem
          key={note.id}
          note={note}
          isActive={activeNoteId === note.id}
          onClick={() => handleNoteClick(note)}
          onDelete={(e) => handleDeleteNote(note.id, e)}
        />
      ))}

      {visibleNotes.length < notes.length && (
        <div ref={loadingRef} className="py-2 text-center text-sm text-muted-foreground">
          {isLoading ? "Loading more notes..." : "Scroll for more"}
        </div>
      )}
    </div>
  );
};

export default NoteListItem;
