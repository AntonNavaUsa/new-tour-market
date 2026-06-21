import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Edit2, Plus, Trash2, X } from 'lucide-react';
import { cardsApi } from '../lib/api';
import { faqsApi, faqTemplatesApi, bookingStepsTemplatesApi } from '../lib/api/faqs';
import type { Faq, FaqTemplate, BookingStepsTemplate } from '../lib/api/faqs';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

// ── Templates section ────────────────────────────────────────────────────────

const EMPTY_TPL = { question: '', answer: '', sortOrder: 0 };

function TemplatesSection() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<FaqTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_TPL);
  const [error, setError] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['faq-templates'],
    queryFn: () => faqTemplatesApi.findAll(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['faq-templates'] });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_TPL) => faqTemplatesApi.create(data),
    onSuccess: () => { invalidate(); setCreating(false); setForm(EMPTY_TPL); setError(''); },
    onError: (e) => setError(handleApiError(e)),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY_TPL }) =>
      faqTemplatesApi.update(id, data),
    onSuccess: () => { invalidate(); setEditing(null); setError(''); },
    onError: (e) => setError(handleApiError(e)),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => faqTemplatesApi.remove(id),
    onSuccess: () => invalidate(),
    onError: (e) => setError(handleApiError(e)),
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY_TPL); setError(''); setCreating(true); };
  const openEdit = (t: FaqTemplate) => {
    setCreating(false); setError('');
    setForm({ question: t.question, answer: t.answer, sortOrder: t.sortOrder });
    setEditing(t);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle>Шаблоны вопросов</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Готовые формулировки — выбирайте из выпадающего списка при редактировании FAQ карточки,
            чтобы не вводить одно и то же вручную.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Добавить шаблон
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {(creating || !!editing) && (
          <form onSubmit={handleSubmit} className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{editing ? 'Редактировать шаблон' : 'Новый шаблон'}</span>
              <button type="button" onClick={() => { setCreating(false); setEditing(null); }}
                className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Вопрос *</label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                required placeholder="Нужна ли специальная подготовка?" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Ответ *</label>
              <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })}
                required placeholder="Текст ответа..." />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Порядок</label>
              <Input type="number" className="w-24" value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Сохранить' : 'Создать'}
              </Button>
              <Button type="button" size="sm" variant="outline"
                onClick={() => { setCreating(false); setEditing(null); }}>Отмена</Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Загрузка...</div>
        ) : templates.length === 0 && !creating && !editing ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Нет шаблонов. Добавьте первый.
          </div>
        ) : (
          templates.length > 0 && (
            <div className="divide-y divide-border rounded-xl border overflow-hidden">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{tpl.question}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{tpl.answer}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={() => openEdit(tpl)}
                      className="text-muted-foreground hover:text-foreground" title="Редактировать">
                      <Edit2 className="h-4 w-4" /></button>
                    <button type="button"
                      onClick={() => { if (confirm('Удалить шаблон?')) deleteMutation.mutate(tpl.id); }}
                      className="text-muted-foreground hover:text-destructive" title="Удалить">
                      <Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

// ── Per-card FAQs section ─────────────────────────────────────────────────────

const EMPTY_FAQ = { cardId: '', question: '', answer: '', sortOrder: 0, isVisible: true };

function CardFaqsSection() {
  const queryClient = useQueryClient();
  const [selectedCardId, setSelectedCardId] = useState('');
  const [editing, setEditing] = useState<Faq | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FAQ);
  // Для создания — список выбранных карточек (множественный выбор)
  const [createCardIds, setCreateCardIds] = useState<string[]>([]);
  const [cardSearch, setCardSearch] = useState('');
  const [error, setError] = useState('');

  const { data: cardsData } = useQuery({
    queryKey: ['admin-cards-list'],
    queryFn: () => cardsApi.getCards({ includeNonPublished: true, take: 200 }),
  });
  const allCards = cardsData?.data ?? [];

  const { data: templates = [] } = useQuery({
    queryKey: ['faq-templates'],
    queryFn: () => faqTemplatesApi.findAll(),
  });

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['admin-faqs-page', selectedCardId],
    queryFn: () => faqsApi.findAll(selectedCardId || undefined),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-faqs-page', selectedCardId] });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FAQ) => faqsApi.create(data),
    onError: (e) => setError(handleApiError(e)),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Faq> }) => faqsApi.update(id, data),
    onSuccess: () => { invalidate(); setEditing(null); setError(''); },
    onError: (e) => setError(handleApiError(e)),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => faqsApi.remove(id),
    onSuccess: () => invalidate(),
    onError: (e) => setError(handleApiError(e)),
  });
  const reorderMutation = useMutation({
    mutationFn: ({ cardId, ids }: { cardId: string; ids: string[] }) =>
      faqsApi.reorder(cardId, ids),
    onSuccess: () => invalidate(),
    onError: (e) => setError(handleApiError(e)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FAQ });
    setCreateCardIds(selectedCardId ? [selectedCardId] : []);
    setCardSearch('');
    setError('');
    setCreating(true);
  };
  const openEdit = (faq: Faq) => {
    setCreating(false); setError('');
    setForm({ cardId: faq.cardId, question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder, isVisible: faq.isVisible });
    setEditing(faq);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (editing) {
      // Редактирование — одна карточка
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      // Создание — по одной записи на каждую выбранную карточку
      if (createCardIds.length === 0) { setError('Выберите хотя бы одну карточку тура'); return; }
      try {
        await Promise.all(
          createCardIds.map((cardId) =>
            createMutation.mutateAsync({ ...form, cardId })
          )
        );
        invalidate();
        setCreating(false);
        setForm(EMPTY_FAQ);
        setCreateCardIds([]);
      } catch {
        // error already set by mutation
      }
    }
  };

  const toggleCardId = (id: string) => {
    setCreateCardIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const filteredCards = cardSearch.trim()
    ? allCards.filter((c) => c.title.toLowerCase().includes(cardSearch.toLowerCase()))
    : allCards;

  const grouped: Record<string, { cardTitle: string; items: Faq[] }> = {};
  faqs.forEach((faq) => {
    if (!grouped[faq.cardId]) {
      const card = allCards.find((c) => c.id === faq.cardId);
      grouped[faq.cardId] = { cardTitle: card?.title ?? faq.cardId, items: [] };
    }
    grouped[faq.cardId].items.push(faq);
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle>FAQ по карточкам</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Вопросы, привязанные к конкретным карточкам. Также управляется через вкладку «FAQ» в редакторе карточки.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Добавить вопрос
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full max-w-sm"
          value={selectedCardId}
          onChange={(e) => setSelectedCardId(e.target.value)}
        >
          <option value="">Все карточки</option>
          {allCards.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {isFormOpen && (
          <form onSubmit={handleSubmit} className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{editing ? 'Редактировать вопрос' : 'Новый вопрос'}</span>
              <button type="button" onClick={() => { setCreating(false); setEditing(null); }}
                className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            {/* Карточки туров */}
            {editing ? (
              // В режиме редактирования — одиночный выбор
              <div>
                <label className="text-xs font-medium mb-1 block">Карточка тура *</label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.cardId} onChange={(e) => setForm({ ...form, cardId: e.target.value })} required>
                  <option value="">— Выберите карточку —</option>
                  {allCards.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            ) : (
              // В режиме создания — множественный выбор с чекбоксами
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Карточки туров *
                  {createCardIds.length > 0 && (
                    <span className="ml-2 text-primary font-normal">выбрано: {createCardIds.length}</span>
                  )}
                </label>
                <Input
                  placeholder="Поиск по названию..."
                  value={cardSearch}
                  onChange={(e) => setCardSearch(e.target.value)}
                  className="mb-2 h-8 text-sm"
                />
                <div className="max-h-48 overflow-y-auto rounded-md border border-input bg-background divide-y divide-border">
                  {filteredCards.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Ничего не найдено</p>
                  ) : (
                    filteredCards.map((c) => (
                      <label key={c.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={createCardIds.includes(c.id)}
                          onChange={() => toggleCardId(c.id)}
                          className="h-4 w-4 accent-primary shrink-0"
                        />
                        <span className="text-sm leading-snug">{c.title}</span>
                      </label>
                    ))
                  )}
                </div>
                {createCardIds.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Будет создано {createCardIds.length} отдельных записи FAQ — по одной для каждой карточки.
                  </p>
                )}
              </div>
            )}

            {templates.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Заполнить из шаблона</label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    const tpl = templates.find((t) => t.id === e.target.value);
                    if (tpl) setForm((f) => ({ ...f, question: tpl.question, answer: tpl.answer }));
                  }}>
                  <option value="">— выбрать шаблон —</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.question}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium mb-1 block">Вопрос *</label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
                required placeholder="Нужна ли специальная подготовка?" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Ответ *</label>
              <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })}
                required placeholder="Текст ответа..." />
            </div>
            <div className="flex items-center gap-6">
              <div>
                <label className="text-xs font-medium mb-1 block">Порядок</label>
                <Input type="number" className="w-20" value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input type="checkbox" id="faq-page-visible" checked={form.isVisible}
                  onChange={(e) => setForm({ ...form, isVisible: e.target.checked })} className="h-4 w-4" />
                <label htmlFor="faq-page-visible" className="text-sm">Видимый</label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? 'Сохранение...' : editing ? 'Сохранить' : `Создать${createCardIds.length > 1 ? ` (${createCardIds.length})` : ''}`}
              </Button>
              <Button type="button" size="sm" variant="outline"
                onClick={() => { setCreating(false); setEditing(null); }}>Отмена</Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Загрузка...</div>
        ) : faqs.length === 0 && !isFormOpen ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Нет вопросов по выбранному фильтру.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cardId, { cardTitle, items }]) => (
              <div key={cardId}>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">{cardTitle}</h3>
                <div className="divide-y divide-border rounded-xl border overflow-hidden">
                  {items.map((faq, idx) => (
                    <div key={faq.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="flex flex-col gap-0.5 mt-0.5 shrink-0">
                        <button type="button" onClick={() => moveUp(faq, items)} disabled={idx === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-25">
                          <ChevronUp className="h-4 w-4" /></button>
                        <button type="button" onClick={() => moveDown(faq, items)} disabled={idx === items.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-25">
                          <ChevronDown className="h-4 w-4" /></button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{faq.question}</p>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{faq.answer}</p>
                        {!faq.isVisible && <span className="text-xs text-yellow-600 mt-0.5 inline-block">Скрыт</span>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button type="button" onClick={() => openEdit(faq)}
                          className="text-muted-foreground hover:text-foreground" title="Редактировать">
                          <Edit2 className="h-4 w-4" /></button>
                        <button type="button"
                          onClick={() => { if (confirm('Удалить вопрос?')) deleteMutation.mutate(faq.id); }}
                          className="text-muted-foreground hover:text-destructive" title="Удалить">
                          <Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Booking Steps Templates section ──────────────────────────────────────────

type BookingStep = { title: string; description: string };
const EMPTY_BS_TPL = { name: '', steps: [{ title: '', description: '' }] as BookingStep[] };

function BookingStepsTemplatesSection() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<BookingStepsTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ name: string; steps: BookingStep[] }>(EMPTY_BS_TPL);
  const [error, setError] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['booking-steps-templates'],
    queryFn: () => bookingStepsTemplatesApi.findAll(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['booking-steps-templates'] });

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => bookingStepsTemplatesApi.create(d),
    onSuccess: () => { invalidate(); setCreating(false); setForm(EMPTY_BS_TPL); setError(''); },
    onError: (e) => setError(handleApiError(e)),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) =>
      bookingStepsTemplatesApi.update(id, data),
    onSuccess: () => { invalidate(); setEditing(null); setError(''); },
    onError: (e) => setError(handleApiError(e)),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => bookingStepsTemplatesApi.remove(id),
    onSuccess: () => invalidate(),
    onError: (e) => setError(handleApiError(e)),
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY_BS_TPL); setError(''); setCreating(true); };
  const openEdit = (t: BookingStepsTemplate) => {
    setCreating(false); setError('');
    setForm({ name: t.name, steps: t.steps });
    setEditing(t);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = { ...form, steps: form.steps.filter(s => s.title.trim()) };
    if (editing) updateMutation.mutate({ id: editing.id, data: clean });
    else createMutation.mutate(clean);
  };

  const updateStep = (idx: number, field: keyof BookingStep, val: string) =>
    setForm(f => ({ ...f, steps: f.steps.map((s, i) => i === idx ? { ...s, [field]: val } : s) }));
  const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, { title: '', description: '' }] }));
  const removeStep = (idx: number) =>
    setForm(f => ({ ...f, steps: f.steps.filter((_, i) => i !== idx) }));

  const isFormOpen = creating || !!editing;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle>Шаблоны «После бронирования»</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Наборы шагов для блока «Что происходит после бронирования». Выбираются в редакторе карточки.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Добавить шаблон
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {isFormOpen && (
          <form onSubmit={handleSubmit} className="rounded-xl border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{editing ? 'Редактировать шаблон' : 'Новый шаблон'}</span>
              <button type="button" onClick={() => { setCreating(false); setEditing(null); }}
                className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Название шаблона *</label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                required placeholder="Например: Стандартный / Трекинг" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-medium block">Шаги</label>
              {form.steps.map((step, idx) => (
                <div key={idx} className="rounded-md border bg-background p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Шаг {idx + 1}</span>
                    <button type="button" onClick={() => removeStep(idx)}
                      className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Input value={step.title} onChange={(e) => updateStep(idx, 'title', e.target.value)}
                    placeholder="Заголовок шага" />
                  <Input value={step.description} onChange={(e) => updateStep(idx, 'description', e.target.value)}
                    placeholder="Описание" />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Добавить шаг
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Сохранить' : 'Создать'}
              </Button>
              <Button type="button" size="sm" variant="outline"
                onClick={() => { setCreating(false); setEditing(null); }}>Отмена</Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Загрузка...</div>
        ) : templates.length === 0 && !isFormOpen ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Нет шаблонов. Добавьте первый.
          </div>
        ) : (
          templates.length > 0 && (
            <div className="divide-y divide-border rounded-xl border overflow-hidden">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tpl.steps.length} {tpl.steps.length === 1 ? 'шаг' : tpl.steps.length < 5 ? 'шага' : 'шагов'}
                      {tpl.steps[0] ? ` · ${tpl.steps[0].title}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={() => openEdit(tpl)}
                      className="text-muted-foreground hover:text-foreground" title="Редактировать">
                      <Edit2 className="h-4 w-4" /></button>
                    <button type="button"
                      onClick={() => { if (confirm('Удалить шаблон?')) deleteMutation.mutate(tpl.id); }}
                      className="text-muted-foreground hover:text-destructive" title="Удалить">
                      <Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminFaqsPage() {
  return (
    <div className="container py-10 max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">FAQ и Шаблоны</h1>
        <p className="text-muted-foreground">
          Управление шаблонами и FAQ для каждой карточки.
        </p>
      </div>
      <TemplatesSection />
      <BookingStepsTemplatesSection />
      <CardFaqsSection />
    </div>
  );
}
