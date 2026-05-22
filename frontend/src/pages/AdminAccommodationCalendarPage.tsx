import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { accommodationsApi } from '../lib/api/accommodationsApi';
import { handleApiError } from '../lib/axios';
import { Card, CardContent } from '../components/ui/card';
import { OccupancyCalendar } from '../components/OccupancyCalendar';

export function AdminAccommodationCalendarPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);

  const { data: accommodation } = useQuery({
    queryKey: ['accommodation', id],
    queryFn: () => accommodationsApi.getOne(id!),
    enabled: !!id,
  });

  const { data: calendarData, isLoading, refetch } = useQuery({
    queryKey: ['accommodation-calendar', id, calYear, calMonth],
    queryFn: () => accommodationsApi.getCalendar(id!, calYear, calMonth),
    enabled: !!id,
  });

  const createBlockMutation = useMutation({
    mutationFn: ({ dateFrom, dateTo, reason }: { dateFrom: string; dateTo: string; reason?: string }) =>
      accommodationsApi.createBlock(id!, { dateFrom, dateTo, reason }),
    onSuccess: () => refetch(),
    onError: (err) => setError(handleApiError(err)),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (blockId: string) => accommodationsApi.deleteBlock(id!, blockId),
    onSuccess: () => refetch(),
    onError: (err) => setError(handleApiError(err)),
  });

  return (
    <div className="container py-8 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </button>

      <h1 className="text-2xl font-bold mb-2">Занятость объекта размещения</h1>
      {accommodation && (
        <p className="text-muted-foreground mb-6">{accommodation.name}</p>
      )}

      {error && (
        <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardContent className="p-6">
          <OccupancyCalendar
            blocks={(calendarData?.blocks ?? []).map((b) => ({
              ...b,
              dateFrom: typeof b.dateFrom === 'string' ? b.dateFrom : new Date(b.dateFrom).toISOString(),
              dateTo: typeof b.dateTo === 'string' ? b.dateTo : new Date(b.dateTo).toISOString(),
            }))}
            orders={calendarData?.orders ?? []}
            year={calYear}
            month={calMonth}
            onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
            onAddBlock={async (dateFrom, dateTo, reason) => {
              await createBlockMutation.mutateAsync({ dateFrom, dateTo, reason });
            }}
            onDeleteBlock={async (blockId) => {
              await deleteBlockMutation.mutateAsync(blockId);
            }}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
