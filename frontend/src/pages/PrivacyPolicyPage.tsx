import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function PrivacyPolicyPage() {
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    fetch('/pers_policy.md')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load privacy policy');
        }

        return response.text();
      })
      .then(setMarkdown)
      .catch(() => setError('Не удалось загрузить политику обработки персональных данных.'));
  }, []);

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Документы</p>
          <h1 className="text-3xl font-bold">Обработка персональных данных</h1>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <article className="prose prose-stone max-w-none rounded-2xl border bg-card p-6 shadow-sm prose-headings:mt-6 prose-p:leading-7 prose-li:leading-7">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown || 'Загрузка политики...'}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  );
}
