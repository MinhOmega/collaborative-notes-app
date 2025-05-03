import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNoteStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import JoinNoteModal from "./join-note-modal";
import NoteEditor from "./note-editor";
import NoteList from "./note-list";

const NotesLayout = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { activeNote } = useNoteStore();
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b px-4 py-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">NoteShare</h1>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setShowJoinModal(true)}
          >
            <LogIn size={16} />
            Join Note
          </Button>

          {isMobile && (
            <Button
              variant="ghost"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? "Hide Notes" : "Show Notes"}
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={cn(
            "border-r w-72 flex-shrink-0 transition-all",
            isMobile && (sidebarOpen ? "w-full" : "w-0"),
          )}
        >
          <NoteList />
        </aside>

        <main className={cn("flex-1", isMobile && sidebarOpen && "hidden")}>
          <NoteEditor noteId={activeNote?.id || ""} />
        </main>
      </div>

      {showJoinModal && (
        <JoinNoteModal onClose={() => setShowJoinModal(false)} />
      )}
    </div>
  );
};

export default NotesLayout;
