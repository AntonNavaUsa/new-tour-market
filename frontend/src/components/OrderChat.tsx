import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { Button } from './ui/button';
import { messagesApi } from '../lib/api/messages';

interface OrderChatProps {
  orderId: string;
  /** true = организатор/администратор смотрит чат */
  isOrganizer: boolean;
}

export function OrderChat({ orderId, isOrganizer }: OrderChatProps) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['order-messages', orderId],
    queryFn: () => messagesApi.getMessages(orderId),
    refetchInterval: 8000,
  });

  const sendMutation = useMutation({
    mutationFn: (t: string) => messagesApi.sendMessage(orderId, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-messages', orderId] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      setText('');
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Invalidate unread count when this chat is viewed
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['unread-count'] });
  }, [messages.length, queryClient]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  return (
    <div className="space-y-3">
      {/* Messages list */}
      <div className="max-h-60 min-h-[80px] overflow-y-auto space-y-2 pr-1 rounded-lg bg-muted/30 border p-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Загрузка...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isOrganizer ? 'Сообщений от клиента пока нет' : 'Напишите вопрос — организатор ответит в ближайшее время'}
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = isOrganizer ? msg.isFromOrganizer : !msg.isFromOrganizer;
            const timeStr = new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const dateStr = new Date(msg.createdAt).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
            });

            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-background border text-foreground rounded-bl-none'
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs font-semibold mb-0.5 opacity-60">
                      {isOrganizer ? (msg.sender?.name ?? 'Клиент') : 'Организатор'}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className={`text-xs mt-0.5 text-right ${isMine ? 'opacity-60' : 'text-muted-foreground'}`}>
                    {dateStr} {timeStr}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          placeholder="Ваш вопрос..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={sendMutation.isPending}
          maxLength={2000}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
          className="shrink-0 gap-1.5"
        >
          <Send className="h-4 w-4" />
          Отправить
        </Button>
      </div>

      {sendMutation.isError && (
        <p className="text-xs text-destructive">Не удалось отправить. Попробуйте снова.</p>
      )}
    </div>
  );
}
