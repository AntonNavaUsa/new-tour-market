import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { guidePagesApi } from '../lib/api';
import { Button } from '../components/ui/button';

export function AdminGuidePagesPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['admin-guide-pages'],
    queryFn: guidePagesApi.adminList,
  });

  const deleteMutation = useMutation({
    mutationFn: guidePagesApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-guide-pages'] }),
    onError: () => setError('Не удалось удалить страницу'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      guidePagesApi.update(id, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-guide-pages'] }),
  });

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Путеводитель — страницы</h1>
        <Link to="/admin/guide-pages/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Создать
          </Button>
        </Link>
      </div>

      {error && <p className="text-destructive mb-4 text-sm">{error}</p>}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse bg-stone-100 rounded-lg" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Нет страниц. Создайте первую.
        </div>
      ) : (
        <div className="divide-y border rounded-lg bg-white">
          {pages.map((page) => (
            <div key={page.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{page.title}</p>
                <p className="text-xs text-muted-foreground">/{page.slug}</p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  page.isPublished
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {page.isPublished ? 'Опубликовано' : 'Черновик'}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  title={page.isPublished ? 'Снять с публикации' : 'Опубликовать'}
                  onClick={() => toggleMutation.mutate({ id: page.id, isPublished: !page.isPublished })}
                >
                  {page.isPublished ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Link to={`/admin/guide-pages/${page.id}`}>
                  <Button size="sm" variant="ghost">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Удалить страницу "${page.title}"?`)) {
                      deleteMutation.mutate(page.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
