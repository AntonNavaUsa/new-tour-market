import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar } from 'lucide-react';
import { guidePagesApi } from '../lib/api';
import { Button } from '../components/ui/button';

export function GuidePagePage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['guide-page', slug],
    queryFn: () => guidePagesApi.getBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="container py-16">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-stone-100 rounded w-2/3" />
          <div className="h-4 bg-stone-100 rounded w-1/3" />
          <div className="h-64 bg-stone-100 rounded-xl" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-stone-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Страница не найдена</h1>
        <Link to="/">
          <Button variant="outline">На главную</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      {/* Back */}
      <Link to="/#tours" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        На главную
      </Link>

      {/* Hero image */}
      {page.headPhotoUrl && (
        <div className="rounded-2xl overflow-hidden mb-8 h-72 md:h-96">
          <img src={page.headPhotoUrl} alt={page.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 leading-tight">{page.title}</h1>
        {page.excerpt && (
          <p className="text-muted-foreground text-lg leading-relaxed">{page.excerpt}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
          <Calendar className="h-3.5 w-3.5" />
          Обновлено: {new Date(page.updatedAt).toLocaleDateString('ru-RU')}
        </div>
      </header>

      {/* Content */}
      <article
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
