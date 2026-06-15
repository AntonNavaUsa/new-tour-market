import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Edit2, Plus, Trash2, X } from 'lucide-react';
import { cardsApi, faqsApi } from '../lib/api';
import type { Faq } from '../lib/api/faqs';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const EMPTY_FORM = {
  cardId: '',
  question: '',
  answer: '',
  sortOrder: 0,
  isVisible: true,
};

export function AdminFaqsPage() {
  const queryClient = useQueryClient();

  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [editing, setEditing] = useState<Faq | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const { data: cardsData } = useQuery({
    queryKey: ['admin-cards-list'],
    queryFn: () => cardsApi.getCards({ includeNonPublished: true, take: 200 }),
  });
  const allCards = cardsData?.data ?? [];

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['admin-faqs', selectedCardId],
    queryFn: () => faqsApi.findAll(selectedCardId || undefined),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => faqsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      setCreating(false);
      setForm(EMPTY_FORM);
      setError('');
    },
    onError: (e) => setError(handleApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Faq> }) =>
      faqsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      setEditing(null);
      setError('');
    },
    onError: (e) => setError(handleApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => faqsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-faqs'] }),
    onError: (e) => setError(handleApiError(e)),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ cardId, ids }: { cardId: string; ids: string[] }) =>
      faqsApi.reorder(cardId, ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-faqs'] }),
    onError: (e) => setError(handleApiError(e)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, cardId: selectedCardId });
    setError('');
    setCreating(true);
  };

  const openEdit = (faq: Faq) => {
    setCreating(false);
    setError('');
    setForm({
      cardId: faq.cardId,
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sortOrder,
      isVisible: faq.isVisible,
    });
    setEditing(faq);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cardId) { setError('Выберите карточку'); return; }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const moveUp = (faq: Faq, list: Faq[]) => {
    const idx = list.findIndex((f) => f.id === faq.id);
    if (idx === 0) return;
    const ids = list.map((f) => f.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    reorderMutation.mutate({ cardId: faq.cardId, ids });
  };

  const moveDown = (faq: Faq, list: Faq[]) => {
    const idx = list.findIndex((f) => f.id === faq.id);
    if (idx === list.length - 1) return;
    const ids = list.map((f) => f.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    reorderMutation.mutate({ cardId: faq.cardId, ids });
  };

  const isFormOpen = creating || !!editing;

  // Group by card for display
  const grouped: Record<string, { cardTitle: string; items: Faq[] }> = {};
  faqs.forEach((faq) => {
    if (!grouped[faq.cardId]) {
      const card = allCards.find((c) => c.id === faq.cardId);
      grouped[faq.cardId] = { cardTitle: card?.title ?? faq.cardId, items: [] };
    }
    grouped[faq.cardId].items.push(faq);
  });

  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Частые вопросы</h1>
          <p className="text-muted-foreground">Управление FAQ для каждой карточки</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить вопрос
        </Button>
      </div>

      {/* Filter by card */}
      <div className="mb-6">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full max-w-sm"
          value={selectedCardId}
          onChange={(e) => setSelectedCardId(e.target.value)}
        >
          <option value="">Все карточки</option>
          {allCards.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editing ? 'Редактировать вопрос' : 'Новый вопрос'}
            </h2>
            <button type="button" onClick={() => { setCreating(false); setEditing(null); }}>
              <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Карточка тура *</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.cardId}
              onChange={(e) => setForm({ ...form, cardId: e.target.value })}
              required
            >
              <option value="">— Выберите карточку —</option>
              {allCards.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Вопрос *</label>
            <Input
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              required
              placeholder="Нужна ли специальная подготовка?"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Ответ *</label>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              required
              placeholder="Текст ответа..."
            />
          </div>

          <div className="flex items-center gap-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Порядок</label>
              <Input
                type="number"
                className="w-24"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="isVisible"
                checked={form.isVisible}
                onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="isVisible" className="text-sm">Видимый</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setCreating(false); setEditing(null); }}
            >
              Отмена
            </Button>
          </div>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Загрузка...</div>
      ) : faqs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Нет вопросов. Нажмите «Добавить вопрос».
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cardId, { cardTitle, items }]) => (
            <div key={cardId}>
              <h3 className="text-base font-semibold mb-3 text-muted-foreground">{cardTitle}</h3>
              <div className="divide-y divide-border rounded-xl border overflow-hidden">
                {items.map((faq, idx) => (
                  <div key={faq.id} className="flex items-start gap-3 px-5 py-4">
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5 mt-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveUp(faq, items)}
                        disabled={idx === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(faq, items)}
                        disabled={idx === items.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{faq.question}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                      {!faq.isVisible && (
                        <span className="text-xs text-yellow-600 mt-1 inline-block">Скрыт</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(faq)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Редактировать"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Удалить вопрос?')) deleteMutation.mutate(faq.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
