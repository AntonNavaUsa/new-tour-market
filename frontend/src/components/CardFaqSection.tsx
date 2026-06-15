import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Edit2, Plus, Trash2, X } from 'lucide-react';
import { faqsApi, faqTemplatesApi } from '../lib/api/faqs';
import type { Faq, FaqTemplate } from '../lib/api/faqs';
import { handleApiError } from '../lib/axios';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Props {
  cardId: string;
}

const EMPTY_FORM = { question: '', answer: '', isVisible: true };

export function CardFaqSection({ cardId }: Props) {
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<Faq | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [error, setError] = useState('');

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['admin-faqs', cardId],
    queryFn: () => faqsApi.findAll(cardId),
    enabled: !!cardId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['faq-templates'],
    queryFn: () => faqTemplatesApi.findAll(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-faqs', cardId] });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) =>
      faqsApi.create({ ...data, cardId, sortOrder: faqs.length }),
    onSuccess: () => { invalidate(); setCreating(false); setForm(EMPTY_FORM); setSelectedTemplateId(''); setError(''); },
    onError: (e) => setError(handleApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Faq> }) =>
      faqsApi.update(id, data),
    onSuccess: () => { invalidate(); setEditing(null); setError(''); },
    onError: (e) => setError(handleApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => faqsApi.remove(id),
    onSuccess: () => invalidate(),
    onError: (e) => setError(handleApiError(e)),
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => faqsApi.reorder(cardId, ids),
    onSuccess: () => invalidate(),
    onError: (e) => setError(handleApiError(e)),
  });

  const applyTemplate = (tpl: FaqTemplate) => {
    setForm({ question: tpl.question, answer: tpl.answer, isVisible: true });
    setSelectedTemplateId(tpl.id);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSelectedTemplateId('');
    setError('');
    setCreating(true);
  };

  const openEdit = (faq: Faq) => {
    setCreating(false);
    setError('');
    setSelectedTemplateId('');
    setForm({ question: faq.question, answer: faq.answer, isVisible: faq.isVisible });
    setEditing(faq);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const moveUp = (faq: Faq) => {
    const idx = faqs.findIndex((f) => f.id === faq.id);
    if (idx === 0) return;
    const ids = faqs.map((f) => f.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    reorderMutation.mutate(ids);
  };

  const moveDown = (faq: Faq) => {
    const idx = faqs.findIndex((f) => f.id === faq.id);
    if (idx === faqs.length - 1) return;
    const ids = faqs.map((f) => f.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    reorderMutation.mutate(ids);
  };

  const isFormOpen = creating || !!editing;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Вопросы и ответы, которые отображаются на странице карточки для посетителей.
        </p>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Добавить вопрос
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Form */}
      {isFormOpen && (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              {editing ? 'Редактировать вопрос' : 'Новый вопрос'}
            </span>
            <button
              type="button"
              onClick={() => { setCreating(false); setEditing(null); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Template picker */}
          {templates.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Заполнить из шаблона
              </label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedTemplateId}
                onChange={(e) => {
                  const tpl = templates.find((t) => t.id === e.target.value);
                  if (tpl) applyTemplate(tpl);
                  else { setSelectedTemplateId(''); }
                }}
              >
                <option value="">— выбрать шаблон —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.question}</option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Вопрос *</label>
              <Input
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                required
                placeholder="Нужна ли специальная подготовка?"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Ответ *</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                required
                placeholder="Текст ответа..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`faq-visible-${editing?.id ?? 'new'}`}
                checked={form.isVisible}
                onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor={`faq-visible-${editing?.id ?? 'new'}`} className="text-sm">
                Видимый
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editing ? 'Сохранить' : 'Добавить'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => { setCreating(false); setEditing(null); }}
              >
                Отмена
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Загрузка...</div>
      ) : faqs.length === 0 && !isFormOpen ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Нет вопросов. Нажмите «Добавить вопрос».
        </div>
      ) : (
        faqs.length > 0 && (
          <div className="divide-y divide-border rounded-xl border overflow-hidden">
            {faqs.map((faq, idx) => (
              <div key={faq.id} className="flex items-start gap-3 px-4 py-3">
                {/* Reorder arrows */}
                <div className="flex flex-col gap-0.5 mt-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(faq)}
                    disabled={idx === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-25"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(faq)}
                    disabled={idx === faqs.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-25"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{faq.question}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{faq.answer}</p>
                  {!faq.isVisible && (
                    <span className="text-xs text-yellow-600 mt-0.5 inline-block">Скрыт</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
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
                    onClick={() => { if (confirm('Удалить вопрос?')) deleteMutation.mutate(faq.id); }}
                    className="text-muted-foreground hover:text-destructive"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
