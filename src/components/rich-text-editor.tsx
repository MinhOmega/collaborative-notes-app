import { useNoteStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ActiveUser } from "@/types/note";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { debounce } from "lodash-es";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ToolbarButton from "./ui/toolbar-button";
import ActiveUsersList from "./active-users-list";

interface RichTextEditorProps {
  content: string;
  noteId: string;
  currentUser: ActiveUser;
}

export const RichTextEditor = ({ content, noteId }: RichTextEditorProps) => {
  const { syncNoteContent, activeUsers, error, notes } = useNoteStore();
  const [localContent, setLocalContent] = useState(content);
  const isInitialUpdateRef = useRef(true);
  const lastSyncedContentRef = useRef(content);
  const [showActiveUsers, setShowActiveUsers] = useState(false);

  const currentNote = notes.find((note) => note.id === noteId);
  const isHardcoded = currentNote?.isHardcoded || false;
  const activeUsersList = Array.from(activeUsers.values());

  const debouncedSync = useCallback(
    debounce((noteId: string, html: string) => {
      if (lastSyncedContentRef.current !== html) {
        syncNoteContent(noteId, html);
        lastSyncedContentRef.current = html;
      }
    }, 500),
    [syncNoteContent],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setLocalContent(html);
      debouncedSync(noteId, html);
    },
  });

  useEffect(() => {
    if (editor && content !== localContent && content !== lastSyncedContentRef.current) {
      const selection = editor.state.selection;
      const { from, to } = selection;

      editor.commands.setContent(content);

      if (from < editor.state.doc.content.size && to < editor.state.doc.content.size) {
        editor.commands.setTextSelection({ from, to });
      }

      lastSyncedContentRef.current = content;
      setLocalContent(content);
    }
  }, [content, editor, localContent]);

  useEffect(() => {
    if (editor && isInitialUpdateRef.current) {
      editor.commands.setContent(content);
      isInitialUpdateRef.current = false;
      lastSyncedContentRef.current = content;
    }
  }, [editor, content]);

  if (!editor) {
    return null;
  }

  const isOnline = !error;
  const topRightCornerElm = isHardcoded ? (
    <div
      className="px-2 flex items-center gap-1 text-xs rounded bg-amber-100 text-amber-800"
      title="This is a sample note. Changes are saved locally."
    >
      <span>Local Only</span>
    </div>
  ) : (
    <>
      <div
        className={cn(
          "px-2 flex items-center gap-1 text-xs rounded",
          isOnline ? "text-green-600" : "text-red-600 bg-red-50",
        )}
        title={isOnline ? "Connected" : "Connection error. Changes may not sync."}
      >
        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>
      <ToolbarButton
        isActive={showActiveUsers}
        onClick={() => setShowActiveUsers(!showActiveUsers)}
        label="Show Active Users"
      >
        <Users size={18} />
        {activeUsersList.length > 0 && (
          <span className="absolute top-0 right-0 bg-primary text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">
            {activeUsersList.length}
          </span>
        )}
      </ToolbarButton>
    </>
  );

  return (
    <div
      className={cn(
        "border rounded-md overflow-hidden relative",
        isHardcoded && "border-amber-200",
      )}
    >
      <div className="flex flex-wrap p-1 border-b gap-1">
        <ToolbarButton
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
          disabled={!editor.can().chain().focus().toggleBold().run()}
        >
          <Bold size={18} />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
          disabled={!editor.can().chain().focus().toggleItalic().run()}
        >
          <Italic size={18} />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleMark("underline").run()}
          label="Underline"
          disabled={!editor.can().chain().focus().toggleMark("underline").run()}
        >
          <UnderlineIcon size={18} />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive({ name: "bulletList" })}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Bullet List"
          disabled={!editor.can().chain().focus().toggleBulletList().run()}
        >
          <List size={18} />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive({ name: "orderedList" })}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Ordered List"
          disabled={!editor.can().chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={18} />
        </ToolbarButton>
        <div className="flex-1"></div>

        {topRightCornerElm}
      </div>

      {showActiveUsers && activeUsersList.length > 0 && (
        <div className="p-2 border-b bg-muted/10">
          <h3 className="text-sm font-medium mb-1">Active Collaborators</h3>
          <ActiveUsersList users={activeUsersList} />
        </div>
      )}

      <EditorContent
        editor={editor}
        className="p-4 prose prose-sm max-w-none focus:outline-none min-h-[200px] editor-content prose-ul:pl-5 prose-ol:pl-5 prose-ul:list-disc prose-ol:list-decimal"
      />
    </div>
  );
};
