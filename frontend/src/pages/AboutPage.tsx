import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function AboutPage() {
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    fetch('/about_us.md')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load about text');
        }

        return response.text();
      })
      .then(setMarkdown)
      .catch(() => setError('Не удалось загрузить раздел «О нас».'));
  }, []);

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Компания</p>
          <h1 className="text-3xl font-bold">О нас</h1>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <article className="prose prose-stone max-w-none rounded-2xl border bg-card p-6 shadow-sm prose-headings:mt-6 prose-p:leading-7 prose-li:leading-7">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown || 'Загрузка...'}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  );
}
