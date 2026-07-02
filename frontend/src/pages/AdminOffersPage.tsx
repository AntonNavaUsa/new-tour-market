import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Pencil } from 'lucide-react';
import { metaApi } from '../lib/api';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import type { Offer } from '../types';

export function AdminOffersPage() {
  const queryClient = useQueryClient();
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [revisionDate, setRevisionDate] = useState('');
  const [selectedCardTypeIds, setSelectedCardTypeIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  const { data: offers = [], isLoading: isOffersLoading } = useQuery({
    queryKey: ['admin-offers'],
    queryFn: () => metaApi.getAdminOffers(),
  });

  const { data: cardTypes = [] } = useQuery({
    queryKey: ['meta-card-types'],
    queryFn: () => metaApi.getCardTypes(),
  });

  const selectedOffer = useMemo(
    () => offers.find((offer) => offer.id === selectedOfferId) ?? null,
    [offers, selectedOfferId],
  );

  const resetForm = () => {
    setSelectedOfferId(null);
    setText('');
    setRevisionDate('');
    setSelectedCardTypeIds([]);
    setIsActive(true);
    setError('');
  };

  const loadOffer = (offer: Offer) => {
    setSelectedOfferId(offer.id);
    setText(offer.text);
    setRevisionDate(offer.revisionDate);
    setSelectedCardTypeIds(offer.offerCardTypes.map((item) => item.cardTypeId));
    setIsActive(offer.isActive);
    setError('');
  };

  const createMutation = useMutation({
    mutationFn: () =>
      metaApi.createOffer({
        text,
        revisionDate,
        cardTypeIds: selectedCardTypeIds,
        isActive,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      resetForm();
    },
    onError: (err) => setError(handleApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      metaApi.updateOffer(selectedOfferId!, {
        text,
        revisionDate,
        cardTypeIds: selectedCardTypeIds,
        isActive,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      resetForm();
    },
    onError: (err) => setError(handleApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => metaApi.deleteOffer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      if (selectedOfferId) {
        resetForm();
      }
    },
    onError: (err) => setError(handleApiError(err)),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (!text.trim()) {
      setError('Текст оферты обязателен');
      return;
    }
    if (!revisionDate.trim()) {
      setError('Дата редакции обязательна');
      return;
    }
    if (selectedCardTypeIds.length === 0) {
      setError('Выберите хотя бы один тип карточки');
      return;
    }

    setError('');
    if (selectedOfferId) {
      updateMutation.mutate();
      return;
    }
    createMutation.mutate();
  };

  const toggleCardType = (cardTypeId: string) => {
    setSelectedCardTypeIds((prev) =>
      prev.includes(cardTypeId)
        ? prev.filter((id) => id !== cardTypeId)
        : [...prev, cardTypeId],
    );
  };

  return (
    <div className="container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Оферты</h1>
          <p className="text-muted-foreground">Управление текстами оферт и привязкой к типам карточек.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            К настройкам
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Список оферт</CardTitle>
              <Button size="sm" variant="outline" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Новая
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isOffersLoading ? (
              <div className="text-sm text-muted-foreground">Загрузка...</div>
            ) : offers.length === 0 ? (
              <div className="text-sm text-muted-foreground">Оферты пока не добавлены.</div>
            ) : (
              offers.map((offer) => (
                <div key={offer.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">Редакция: {offer.revisionDate}</p>
                      <p className="text-xs text-muted-foreground">
                        {offer.isActive ? 'Активна' : 'Отключена'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => loadOffer(offer)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(offer.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="line-clamp-3 text-xs text-muted-foreground whitespace-pre-wrap">{offer.text}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{selectedOffer ? 'Редактирование оферты' : 'Новая оферта'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Дата редакции</label>
              <input
                type="date"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={revisionDate}
                onChange={(event) => setRevisionDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Текст оферты (Markdown)</label>
              <textarea
                className="min-h-[280px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="# Договор-оферта"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Для каких видов карточек</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {cardTypes.map((cardType) => (
                  <label key={cardType.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedCardTypeIds.includes(cardType.id)}
                      onChange={() => toggleCardType(cardType.id)}
                    />
                    <span>{cardType.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Оферта активна
            </label>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Сохранение...' : selectedOffer ? 'Сохранить изменения' : 'Создать оферту'}
              </Button>
              {selectedOffer && (
                <Button variant="outline" onClick={resetForm}>
                  Отменить
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
