import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor({ value, onChange, className, disabled }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // Sync external value changes into the editor (e.g. when card data loads)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={cn('rounded-md border border-input', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b border-input p-2">
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          title="Жирный"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          title="Курсив"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-8 w-px bg-border" />
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          className="h-8 px-2 text-xs font-semibold"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          title="Заголовок H2"
        >
          H2
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
          className="h-8 px-2 text-xs font-semibold"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          title="Заголовок H3"
        >
          H3
        </Button>
        <div className="mx-1 h-8 w-px bg-border" />
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          title="Маркированный список"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          title="Нумерованный список"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-8 w-px bg-border" />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          title="Отменить"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          title="Повторить"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2 [&_.ProseMirror]:text-sm [&_.ProseMirror]:outline-none [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:mb-1 [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:ml-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_p.is-editor-empty:first-child_::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child_::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child_::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child_::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child_::before]:pointer-events-none"
      />
    </div>
  );
}
