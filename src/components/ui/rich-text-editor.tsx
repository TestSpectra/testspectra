import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Undo, Redo } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis di sini...",
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-invert max-w-none focus:outline-none min-h-[80px] px-4 py-2 text-sm",
      },
    },
  });

  // Update editor content when value prop changes (for editing existing data)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Only update if the value is actually different to avoid cursor jumps
      const currentContent = editor.getHTML();
      // Check if content is meaningfully different (ignore empty states)
      const isValueEmpty = !value || value === "<p></p>";
      const isEditorEmpty = !currentContent || currentContent === "<p></p>";
      
      if (isValueEmpty && isEditorEmpty) {
        return; // Both empty, no need to update
      }
      
      if (value !== currentContent) {
        editor.commands.setContent(value || "", false);
      }
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={`bg-slate-800 border border-slate-700 rounded-lg overflow-hidden ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-700 bg-slate-800/50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-slate-700 transition-colors ${
            editor.isActive("bold") ? "bg-slate-700 text-blue-400" : "text-slate-400"
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-slate-700 transition-colors ${
            editor.isActive("italic") ? "bg-slate-700 text-blue-400" : "text-slate-400"
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-slate-700 transition-colors ${
            editor.isActive("bulletList") ? "bg-slate-700 text-blue-400" : "text-slate-400"
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-slate-700 transition-colors ${
            editor.isActive("orderedList") ? "bg-slate-700 text-blue-400" : "text-slate-400"
          }`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-slate-700 transition-colors text-slate-400 disabled:opacity-30"
          title="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-slate-700 transition-colors text-slate-400 disabled:opacity-30"
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #64748b;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .ProseMirror li {
          margin: 0.25rem 0;
        }
        .ProseMirror p {
          margin: 0.5rem 0;
        }
        .ProseMirror:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}
