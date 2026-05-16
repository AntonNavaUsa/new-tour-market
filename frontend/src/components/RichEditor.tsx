import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Undo, Redo, Minus, Code, CodeSquare, FileCode } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function RichEditor({ value, onChange }: RichEditorProps) {
  const [showSource, setShowSource] = useState(false);
  const [sourceHtml, setSourceHtml] = useState('');

  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Синхронизируем контент когда value загружается асинхронно (например, при редактировании)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value, false);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  function openSource() {
    setSourceHtml(editor!.getHTML());
    setShowSource(true);
  }

  function applySource() {
    editor!.commands.setContent(sourceHtml, true);
    onChange(sourceHtml);
    setShowSource(false);
  }

  const btn = (active: boolean, onClick: () => void, icon: React.ReactNode, title: string) => (
    <Button
      type="button"
      size="sm"
      variant={active ? 'default' : 'outline'}
      className="h-8 w-8 p-0"
      title={title}
      onClick={onClick}
    >
      {icon}
    </Button>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-stone-50">
        {!showSource && (
          <>
            {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold className="h-4 w-4" />, 'Жирный')}
            {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic className="h-4 w-4" />, 'Курсив')}
            <div className="w-px bg-border mx-1" />
            {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 className="h-4 w-4" />, 'Заголовок H2')}
            {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 className="h-4 w-4" />, 'Заголовок H3')}
            <div className="w-px bg-border mx-1" />
            {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List className="h-4 w-4" />, 'Список')}
            {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-4 w-4" />, 'Нумер. список')}
            <div className="w-px bg-border mx-1" />
            {btn(false, () => editor.chain().focus().setHorizontalRule().run(), <Minus className="h-4 w-4" />, 'Разделитель')}
            <div className="w-px bg-border mx-1" />
            {btn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), <Code className="h-4 w-4" />, 'Инлайн-код')}
            {btn(editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), <CodeSquare className="h-4 w-4" />, 'Блок кода')}
            <div className="w-px bg-border mx-1" />
            {btn(false, () => editor.chain().focus().undo().run(), <Undo className="h-4 w-4" />, 'Отменить')}
            {btn(false, () => editor.chain().focus().redo().run(), <Redo className="h-4 w-4" />, 'Повторить')}
            <div className="w-px bg-border mx-1" />
          </>
        )}
        <Button
          type="button"
          size="sm"
          variant={showSource ? 'default' : 'outline'}
          className="h-8 px-2 gap-1 text-xs"
          title="Редактировать HTML"
          onClick={showSource ? applySource : openSource}
        >
          <FileCode className="h-4 w-4" />
          {showSource ? 'Применить HTML' : 'HTML'}
        </Button>
        {showSource && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => setShowSource(false)}
          >
            Отмена
          </Button>
        )}
      </div>
      {/* Source editor */}
      {showSource ? (
        <textarea
          className="w-full p-4 min-h-[300px] font-mono text-sm bg-stone-950 text-green-400 focus:outline-none resize-y"
          value={sourceHtml}
          onChange={(e) => setSourceHtml(e.target.value)}
          spellCheck={false}
        />
      ) : (
        /* Rich editor */
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-4 min-h-[300px] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror_code]:bg-stone-100 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-sm [&_.ProseMirror_pre]:bg-stone-900 [&_.ProseMirror_pre]:text-stone-100 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0"
        />
      )}
    </div>
  );
}
