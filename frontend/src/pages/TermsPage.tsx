import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../components/ui/button';
import { metaApi } from '../lib/api';

export function TermsPage() {
  const [searchParams] = useSearchParams();
  const offerId = searchParams.get('offerId');
  const cardTypeId = searchParams.get('cardTypeId');

  const [fallbackText, setFallbackText] = useState('');
  const [error, setError] = useState('');

  const { data: offer } = useQuery({
    queryKey: ['terms-offer', offerId, cardTypeId],
    queryFn: async () => {
      if (offerId) {
        return metaApi.getOfferById(offerId);
      }
      if (cardTypeId) {
        return metaApi.getOfferForCardType(cardTypeId);
      }
      return null;
    },
    enabled: Boolean(offerId || cardTypeId),
    retry: false,
  });

  useEffect(() => {
    window.scrollTo(0, 0);

    fetch('/oferta-selg-guides.txt')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load offer text');
        }

        return response.text();
      })
      .then(setFallbackText)
      .catch(() => setError('Не удалось загрузить текст оферты.'));
  }, []);

  const markdown = offer?.text || fallbackText;
  const revision = offer?.revisionDate || 'не указана';

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Документы</p>
          <h1 className="text-3xl font-bold">Договор-оферта</h1>
          <p className="text-muted-foreground">Редакция: {revision}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/orders">К заказам</Link>
          </Button>
          <Button asChild variant="outline">
            <a href="/oferta-selg-guides.txt" download>
              Скачать текст оферты
            </a>
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <article className="prose prose-stone max-w-none rounded-2xl border bg-card p-6 shadow-sm prose-headings:mt-6 prose-p:leading-7 prose-li:leading-7">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown || 'Загрузка оферты...'}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  );
}