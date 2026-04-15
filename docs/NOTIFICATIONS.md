# Модуль Email уведомлений

## Обзор

Модуль Notifications предоставляет автоматические email уведомления для ключевых событий в системе.

**Используемые технологии:**
- Nodemailer - отправка email
- SMTP (Mailpit для разработки)
- HTML шаблоны с адаптивной версткой

## Настройка

### Переменные окружения (.env)

```env
# SMTP Configuration
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=                     # опционально для разработки
SMTP_PASSWORD=                 # опционально для разработки
SMTP_FROM_EMAIL=noreply@travelio.local
SMTP_FROM_NAME=Travelio Support

# Admin email для уведомлений
ADMIN_EMAIL=admin@travelio.local
```

### Mailpit (для разработки)

Mailpit - это SMTP сервер для тестирования email без реальной отправки.

**Запуск:**
```bash
docker-compose up -d mailpit
```

**Web UI:** http://localhost:8025  
**SMTP порт:** 1025

Все отправленные письма будут видны в веб-интерфейсе Mailpit.

## Автоматические уведомления

### 1. Подтверждение бронирования

**Когда:** При подтверждении заказа (`POST /api/orders/:id/confirm`)  
**Кому:** Пользователь + Админ  
**Тема (пользователь):** "Подтверждение бронирования #ORDER_ID"  
**Тема (админ):** "Новый заказ #ORDER_ID - TOUR_NAME"

**Содержание письма пользователю:**
- Номер заказа
- Название тура
- Дата и время
- Количество участников
- Сумма заказа

**Содержание письма админу:**
- Вся информация о заказе
- Данные клиента (имя, email)
- Контактная информация

**Пример кода (автоматически):**
```typescript
// В OrdersService.confirmBooking()
await this.notificationsService.sendOrderConfirmation(user.email, {
  orderId: confirmed.id,
  cardTitle: confirmed.card.title,
  date: confirmed.date.toLocaleDateString('ru-RU'),
  time: confirmed.time || 'Будет уточнено',
  quantity: confirmed.quantity,
  totalAmount: Number(confirmed.amount),
});
```

### 2. Успешная оплата

**Когда:** После успешного платежа через YooKassa  
**Кому:** Пользователь  
**Тема:** "Оплата успешно получена - Заказ #ORDER_ID"

**Содержание:**
- Зеленый бейдж "Оплачено"
- Номер заказа
- Название тура
- Сумма платежа
- ID транзакции YooKassa

**Пример кода (автоматически):**
```typescript
// В PaymentsService.handleSuccessfulPayment()
await this.notificationsService.sendPaymentSuccessNotification(user.email, {
  orderId: payment.order.id,
  cardTitle: payment.order.card.title,
  amount: Number(payment.amount),
  paymentId: payment.paymentIdExternal || payment.id,
});
```

## Ручная отправка (для кастомных уведомлений)

### Базовый метод sendEmail

```typescript
import { NotificationsService } from './notifications/notifications.service';

constructor(private notificationsService: NotificationsService) {}

async sendCustomEmail() {
  await this.notificationsService.sendEmail({
    to: 'user@example.com',
    subject: 'Тема письма',
    text: 'Текстовая версия письма',
    html: '<h1>HTML версия</h1><p>Письмо с HTML форматированием</p>',
  });
}
```

### HTML шаблоны

Все встроенные шаблоны используют inline CSS для максимальной совместимости с email клиентами.

**Структура шаблона:**
```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; }
      .header { background: #4F46E5; color: white; padding: 20px; }
      .content { background: #f9fafb; padding: 20px; }
      .footer { text-align: center; color: #6b7280; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Заголовок</h1>
      </div>
      <div class="content">
        <!-- Контент -->
      </div>
      <div class="footer">
        <p>&copy; 2026 Travelio</p>
      </div>
    </div>
  </body>
</html>
```

## Тестирование уведомлений

### 1. Проверка подтверждения бронирования

1. Авторизуйтесь как пользователь
2. Создайте заказ через API:
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "CARD_ID",
    "date": "2026-05-01",
    "time": "10:00",
    "quantity": 2,
    "tickets": [
      {
        "ticketId": "TICKET_ID",
        "quantity": 2
      }
    ]
  }'
```

3. Подтвердите заказ:
```bash
curl -X POST http://localhost:3000/api/orders/ORDER_ID/confirm \
  -H "Authorization: Bearer YOUR_TOKEN"
```

4. Откройте Mailpit: http://localhost:8025
5. Вы увидите 2 письма:
   - Пользователю: "Подтверждение бронирования"
   - Админу: "Новый заказ"

### 2. Проверка уведомления об оплате

1. Создайте платеж через API
2. Используйте тестовый endpoint для симуляции успешной оплаты:
```bash
curl -X POST http://localhost:3000/api/payments/PAYMENT_ID/success \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

3. Откройте Mailpit: http://localhost:8025
4. Вы увидите письмо "Оплата успешно получена"

## Логирование

Все действия модуля логируются:

```
[NotificationsService] SMTP transporter initialized: localhost:1025
[NotificationsService] Email sent successfully to user@example.com: <message-id>
[OrdersService] Failed to send email notifications for order xyz: Error details
```

**Важно:** Если отправка email не удалась, ошибка логируется, но не прерывает основной процесс (graceful degradation).

## Production настройка

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=YOUR_SENDGRID_API_KEY
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Your Company Name
```

### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Не обычный пароль!
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Your Company
```

**Примечание:** Для Gmail нужно создать "App Password" в настройках безопасности.

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASSWORD=YOUR_MAILGUN_PASSWORD
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Your Company
```

## Расширение функционала

### Добавление нового типа уведомления

1. Добавьте метод в `NotificationsService`:

```typescript
async sendCancellationNotification(
  userEmail: string,
  data: {
    orderId: string;
    cardTitle: string;
    refundAmount: number;
  },
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          /* Ваши стили */
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: #EF4444;">
            <h1>Бронирование отменено</h1>
          </div>
          <div class="content">
            <p>Ваше бронирование #${data.orderId} было отменено.</p>
            <p>Сумма возврата: ${data.refundAmount} ₽</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await this.sendEmail({
    to: userEmail,
    subject: `Отмена бронирования #${data.orderId}`,
    html,
    text: `Ваше бронирование #${data.orderId} отменено. Возврат: ${data.refundAmount} ₽`,
  });
}
```

2. Вызовите метод в нужном месте:

```typescript
// В OrdersService.cancelOrder()
await this.notificationsService.sendCancellationNotification(
  order.user.email,
  {
    orderId: order.id,
    cardTitle: order.card.title,
    refundAmount: Number(order.amount),
  },
);
```

### Использование шаблонизатора (Handlebars)

Если нужны более сложные шаблоны:

1. Установите Handlebars:
```bash
npm install handlebars @types/handlebars
```

2. Создайте файл шаблона `templates/order-confirmation.hbs`:
```handlebars
<!DOCTYPE html>
<html>
<body>
  <h1>Заказ #{{orderId}}</h1>
  <p>Тур: {{cardTitle}}</p>
  <p>Дата: {{date}}</p>
  <p>Сумма: {{amount}} ₽</p>
</body>
</html>
```

3. Компилируйте и используйте:
```typescript
import * as Handlebars from 'handlebars';
import * as fs from 'fs';

const templateSource = fs.readFileSync('templates/order-confirmation.hbs', 'utf8');
const template = Handlebars.compile(templateSource);

const html = template({
  orderId: 'ABC123',
  cardTitle: 'Экскурсия',
  date: '01.05.2026',
  amount: 5000,
});

await this.sendEmail({ to: 'user@example.com', subject: 'Заказ', html });
```

## Мониторинг и отладка

### Проверка SMTP соединения

```typescript
// В NotificationsService constructor
await this.transporter.verify();
this.logger.log('SMTP connection successful');
```

### Просмотр отправленных писем

Mailpit сохраняет все письма в памяти. Для просмотра:
1. Откройте http://localhost:8025
2. Кликните на письмо для просмотра деталей
3. Проверьте HTML/Text версии
4. Проверьте заголовки (headers)

### Отключение email в тестах

```typescript
// В тестовом окружении
if (process.env.NODE_ENV === 'test') {
  // Не инициализировать transporter
  this.logger.log('Email notifications disabled in test mode');
  return;
}
```

## Частые проблемы

### Письма не отправляются

1. Проверьте, запущен ли Mailpit: `docker ps | grep mailpit`
2. Проверьте логи: письмо должно быть в логах NestJS
3. Проверьте переменные окружения SMTP_*

### Письма в спаме (Production)

1. Настройте SPF запись для вашего домена
2. Настройте DKIM подпись
3. Настройте DMARC политику
4. Используйте dedicated IP от email провайдера

### Долгая отправка

Используйте очереди (Bull, BullMQ) для асинхронной отправки:
```typescript
await this.emailQueue.add('send-order-confirmation', {
  email: user.email,
  orderData: data,
});
```

## Метрики

Рекомендуется отслеживать:
- Количество отправленных писем
- Процент успешных отправок
- Среднее время отправки
- Bounce rate (отказы)
- Open rate (открытия) - с трекинг пикселем

Интеграция с аналитикой через webhooks email провайдера (SendGrid, Mailgun).
