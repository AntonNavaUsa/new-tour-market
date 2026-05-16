import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Download, MapPin, Phone, Mail, Globe, MessageCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { OrderChat } from './OrderChat';
import { messagesApi } from '../lib/api/messages';
import { formatPrice, formatDate } from '../lib/utils';
import type { Order } from '../types';
import { OrderStatus } from '../types';

interface PaidOrderCardProps {
  order: Order;
}

function formatDateRu(dateStr: string): string {
  return formatDate(dateStr);
}

export function PaidOrderCard({ order }: PaidOrderCardProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const { data: existingMessages } = useQuery({
    queryKey: ['order-messages', order.id],
    queryFn: () => messagesApi.getMessages(order.id),
    staleTime: 60000,
  });

  useEffect(() => {
    if (existingMessages && existingMessages.length > 0) {
      setChatOpen(true);
    }
  }, [existingMessages]);

  const isPaid =
    order.status === OrderStatus.PAID || order.status === OrderStatus.COMPLETED;

  if (!isPaid) return null;

  const card = order.card;
  const partner = card?.partner;
  const location = card?.location;
  const contacts = partner?.contacts ?? null;

  const totalAmount = Number(order.amount);
  const prepayment = Number(order.prepaymentAmount);
  const remaining = order.prepaymentAmount ? totalAmount - prepayment : 0;

  const locationStr = [location?.city, location?.region, location?.country]
    .filter(Boolean)
    .join(', ');

  const downloadVoucher = async () => {
    setPdfLoading(true);
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (!printWindow) {
        setPdfLoading(false);
        return;
      }

      const tickets =
        order.orderTickets
          ?.map(
            (ot) =>
              `<tr>
                <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">
                  ${ot.priceSnapshot?.ticketTitle ?? ot.ticket?.title ?? 'Билет'}
                </td>
                <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">
                  ${ot.quantity} шт.
                </td>
                <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">
                  ${ot.priceSnapshot?.calculatedTotal ? formatPrice(ot.priceSnapshot.calculatedTotal) : ''}
                </td>
              </tr>`,
          )
          .join('') ?? '';

      const postPaymentInfo = (card as any)?.postPaymentInfo;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8"/>
          <title>Ваучер — ${card?.title ?? 'Заказ'}</title>
          <style>
            @media print { @page { margin: 15mm; } }
            body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 24px; }
            .logo-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
            .logo-badge { background:#16a34a; color:#fff; font-size:22px; font-weight:700; padding:8px 20px; border-radius:8px; }
            .voucher-badge { font-size:12px; color:#6b7280; border:1px solid #d1fae5; background:#f0fdf4; padding:4px 12px; border-radius:20px; }
            h1 { font-size:22px; margin:0 0 4px; }
            .subtitle { color:#6b7280; font-size:13px; margin-bottom:24px; }
            .section { margin-bottom:20px; }
            .section-title { font-size:11px; font-weight:700; text-transform:uppercase; color:#6b7280; letter-spacing:0.05em; margin-bottom:8px; }
            .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
            .info-item label { display:block; font-size:11px; color:#6b7280; margin-bottom:2px; }
            .info-item span { font-size:14px; font-weight:600; }
            table { width:100%; border-collapse:collapse; margin-bottom:4px; }
            th { text-align:left; padding:6px 12px; background:#f3f4f6; font-size:12px; font-weight:600; }
            .amount-row { font-size:13px; margin:4px 0; }
            .amount-total { font-size:16px; font-weight:700; color:#16a34a; }
            .amount-remaining { font-size:13px; color:#dc2626; font-weight:600; }
            .post-info { background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:14px; font-size:13px; line-height:1.6; white-space:pre-wrap; }
            .contacts-row { display:flex; gap:24px; flex-wrap:wrap; }
            .contact-item { font-size:13px; }
            .footer { margin-top:32px; border-top:1px solid #e5e7eb; padding-top:12px; font-size:11px; color:#9ca3af; text-align:center; }
          </style>
        </head>
        <body>
          <div class="logo-row">
            <div class="logo-badge">Travelio</div>
            <div class="voucher-badge">✓ Подтверждённый ваучер</div>
          </div>

          <h1>${card?.title ?? 'Заказ'}</h1>
          <div class="subtitle">Заказ №${order.id} · Оформлен ${formatDateRu(order.createdAt)}</div>

          <div class="section">
            <div class="section-title">Детали бронирования</div>
            <div class="info-grid">
              <div class="info-item">
                <label>Дата</label>
                <span>${formatDateRu(order.date)}${order.time ? ' в ' + order.time : ''}</span>
              </div>
              ${locationStr ? `<div class="info-item"><label>Место проведения</label><span>${locationStr}</span></div>` : ''}
              ${card?.meetingPoint ? `<div class="info-item"><label>Место встречи</label><span>${card.meetingPoint}</span></div>` : ''}
              <div class="info-item">
                <label>Участник</label>
                <span>${order.customerName ?? '—'}</span>
              </div>
            </div>
          </div>

          ${tickets ? `
          <div class="section">
            <div class="section-title">Билеты</div>
            <table>
              <thead><tr>
                <th>Тип</th><th style="text-align:center">Кол-во</th><th style="text-align:right">Сумма</th>
              </tr></thead>
              <tbody>${tickets}</tbody>
            </table>
          </div>` : ''}

          <div class="section">
            <div class="section-title">Оплата</div>
            <div class="amount-row">Итого: <span class="amount-total">${formatPrice(totalAmount)}</span></div>
            ${prepayment > 0 ? `
            <div class="amount-row">Оплачено онлайн (предоплата): <strong>${formatPrice(prepayment)}</strong></div>
            ${remaining > 0 ? `<div class="amount-row">Остаток организатору: <span class="amount-remaining">${formatPrice(remaining)}</span></div>` : ''}
            ` : ''}
          </div>

          ${partner ? `
          <div class="section">
            <div class="section-title">Организатор</div>
            <div style="font-size:15px;font-weight:600;margin-bottom:8px;">${partner.title}</div>
            <div class="contacts-row">
              ${contacts?.phone ? `<div class="contact-item">📞 ${contacts.phone}</div>` : ''}
              ${contacts?.email ? `<div class="contact-item">✉️ ${contacts.email}</div>` : ''}
              ${contacts?.address ? `<div class="contact-item">📍 ${contacts.address}</div>` : ''}
            </div>
          </div>` : ''}

          ${postPaymentInfo ? `
          <div class="section">
            <div class="section-title">Информация от организатора</div>
            <div class="post-info">${postPaymentInfo}</div>
          </div>` : ''}

          <div class="footer">
            Ваучер сформирован автоматически · travelio.ru
          </div>

          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } finally {
      setPdfLoading(false);
    }
  };

  const postPaymentInfo = (card as any)?.postPaymentInfo as string | undefined;

  return (
    <div className="mt-6 space-y-4 border-t pt-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-green-700 font-semibold text-base">
        <CheckCircle className="h-5 w-5 shrink-0" />
        Заказ оплачен — информация для участника
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Date/time/place */}
        <div className="rounded-lg border border-green-100 bg-green-50 p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-green-700">
            Дата, время и место
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-muted-foreground">Дата и время</div>
              <div className="font-medium">
                {formatDateRu(order.date)}
                {order.time ? ` в ${order.time}` : ''}
              </div>
            </div>
            {locationStr && (
              <div className="flex items-start gap-1.5">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Место проведения</div>
                  <div className="font-medium">{locationStr}</div>
                </div>
              </div>
            )}
            {card?.meetingPoint && (
              <div>
                <div className="text-xs text-muted-foreground">Место встречи</div>
                <div className="font-medium">{card.meetingPoint}</div>
              </div>
            )}
          </div>
        </div>

        {/* Tickets */}
        {order.orderTickets && order.orderTickets.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Оплаченные билеты
            </div>
            <div className="space-y-1.5">
              {order.orderTickets.map((ot) => (
                <div key={ot.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {ot.priceSnapshot?.ticketTitle ?? ot.ticket?.title ?? 'Билет'}
                    {' × '}{ot.quantity}
                  </span>
                  {ot.priceSnapshot?.calculatedTotal ? (
                    <span className="font-medium">
                      {formatPrice(ot.priceSnapshot.calculatedTotal)}
                    </span>
                  ) : null}
                </div>
              ))}
              <div className="border-t pt-1.5 mt-1.5 space-y-0.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Итого</span>
                  <span className="font-bold text-base">{formatPrice(totalAmount)}</span>
                </div>
                {prepayment > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Оплачено онлайн</span>
                      <span className="text-green-700 font-medium">{formatPrice(prepayment)}</span>
                    </div>
                    {remaining > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Остаток организатору</span>
                        <span className="text-red-600 font-semibold">{formatPrice(remaining)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Organizer */}
      {partner && (
        <div className="rounded-lg border p-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Организатор
          </div>
          <div className="font-semibold text-base">{partner.title}</div>
          {contacts && (
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {contacts.phone && (
                <a href={`tel:${contacts.phone}`} className="flex items-center gap-1 hover:text-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {contacts.phone}
                </a>
              )}
              {contacts.email && (
                <a href={`mailto:${contacts.email}`} className="flex items-center gap-1 hover:text-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {contacts.email}
                </a>
              )}
              {contacts.website && (
                <a
                  href={contacts.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {contacts.website}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Post-payment info from organizer */}
      {postPaymentInfo && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <Info className="h-3.5 w-3.5" />
            Информация от организатора
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{postPaymentInfo}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-1">
        <Button
          variant={chatOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChatOpen((v) => !v)}
          className="gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Написать организатору
          {chatOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadVoucher}
          disabled={pdfLoading}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {pdfLoading ? 'Подготовка...' : 'Скачать ваучер'}
        </Button>
      </div>

      {/* Inline chat */}
      {chatOpen && (
        <div className="rounded-lg border bg-background p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-1">
            <MessageCircle className="h-4 w-4 text-primary" />
            Чат с организатором
          </div>
          <OrderChat orderId={order.id} isOrganizer={false} />
        </div>
      )}
    </div>
  );
}
