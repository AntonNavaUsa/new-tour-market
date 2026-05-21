import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Trash2, User } from 'lucide-react';
import { guidesApi } from '../lib/api/guides';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export function AdminGuidesPage() {
  const queryClient = useQueryClient();

  const { data: guides = [], isLoading } = useQuery({
    queryKey: ['admin-guides'],
    queryFn: () => guidesApi.getAllGuides(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => guidesApi.deleteGuide(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-guides'] }),
  });

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Гиды</h1>
        <p className="text-muted-foreground">Список всех гидов. Нажмите «Календарь» для управления занятостью.</p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Загрузка...</div>
      ) : guides.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <User className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>Гидов нет. Гиды добавляются партнёрами в профиле.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Card key={guide.id}>
              <CardContent className="p-4 flex items-center gap-4">
                {guide.photoUrl ? (
                  <img
                    src={guide.photoUrl}
                    alt={guide.name}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-7 h-7 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{guide.name}</p>
                  {guide.certifications && (
                    <p className="text-xs text-muted-foreground truncate">{guide.certifications}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/admin/guides/${guide.id}/calendar`}>
                      <Calendar className="h-3 w-3 mr-1" />
                      Занятость
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive hover:text-white"
                    onClick={() => {
                      if (confirm(`Удалить гида "${guide.name}"?`)) deleteMutation.mutate(guide.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
