import React, { useEffect, useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  ListOrdered,
  List,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNoteStore } from "@/lib/store";
import { debounce } from "lodash-es";
import { ActiveUser } from "@/types/note";

interface RichTextEditorProps {
  content: string;
  noteId: string;
  currentUser: ActiveUser;
}

export const RichTextEditor = ({ content, noteId }: RichTextEditorProps) => {
  const { syncNoteContent, activeUsers, error } = useNoteStore();
  const [localContent, setLocalContent] = useState(content);
  const isInitialUpdateRef = useRef(true);
  const lastSyncedContentRef = useRef(content);
  const [showActiveUsers, setShowActiveUsers] = useState(false);

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
    extensions: [StarterKit, Underline],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setLocalContent(html);
      debouncedSync(noteId, html);
    },
  });

  useEffect(() => {
    if (
      editor &&
      content !== localContent &&
      content !== lastSyncedContentRef.current
    ) {
      const selection = editor.state.selection;
      const { from, to } = selection;

      editor.commands.setContent(content);

      if (
        from < editor.state.doc.content.size &&
        to < editor.state.doc.content.size
      ) {
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

  const ToolbarButton = ({
    isActive,
    onClick,
    children,
    label,
  }: {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-2 rounded hover:bg-muted transition-colors",
        isActive ? "bg-muted text-primary" : "text-muted-foreground",
      )}
      aria-label={label}
      title={label}
      tabIndex={0}
    >
      {children}
    </button>
  );

  if (!editor) {
    return null;
  }

  const isOnline = !error;

  return (
    <div className={cn("border rounded-md overflow-hidden relative")}>
      <div className="flex p-1 border-b gap-1">
        <ToolbarButton
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        >
          <Bold size={18} />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        >
          <Italic size={18} />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleMark("underline").run()}
          label="Underline"
        >
          <UnderlineIcon size={18} />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Bullet List"
        >
          <List size={18} />
        </ToolbarButton>

        <ToolbarButton
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Ordered List"
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        <div className="flex-1"></div>

        <div
          className={cn(
            "px-2 flex items-center gap-1 text-xs rounded",
            isOnline ? "text-green-600" : "text-red-600 bg-red-50",
          )}
          title={
            isOnline ? "Connected" : "Connection error. Changes may not sync."
          }
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
          {activeUsers.size > 0 && (
            <span className="absolute top-0 right-0 bg-primary text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">
              {activeUsers.size}
            </span>
          )}
        </ToolbarButton>
      </div>

      {showActiveUsers && activeUsers.size > 0 && (
        <div className="p-2 border-b bg-muted/10">
          <h3 className="text-sm font-medium mb-1">Active Users</h3>
          <div className="flex flex-wrap gap-1">
            {Array.from(activeUsers.values()).map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                style={{ backgroundColor: user.color + "20" }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: user.color }}
                />
                <span>{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <EditorContent
        editor={editor}
        className="p-4 prose prose-sm max-w-none focus:outline-none min-h-[200px]"
      />
    </div>
  );
};
