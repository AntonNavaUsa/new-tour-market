import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailContext {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get('SMTP_HOST') || 'localhost';
    const smtpPort = parseInt(this.configService.get('SMTP_PORT') || '1025');
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPassword = this.configService.get('SMTP_PASSWORD');

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,  // ← заменить
      auth: smtpUser && smtpPassword ? {
        user: smtpUser,
        pass: smtpPassword,
      } : undefined,
    });

    this.logger.log(`SMTP transporter initialized: ${smtpHost}:${smtpPort}`);
  }

  async sendEmail(context: EmailContext): Promise<void> {
    const fromEmail = this.configService.get('SMTP_FROM_EMAIL') || 'noreply@travelio.local';
    const fromName = this.configService.get('SMTP_FROM_NAME') || 'Travelio';

    try {
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: context.to,
        subject: context.subject,
        text: context.text,
        html: context.html,
      });

      this.logger.log(`Email sent successfully to ${context.to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${context.to}:`, error);
      throw error;
    }
  }

  async sendOrderConfirmation(userEmail: string, orderData: {
    orderId: string;
    cardTitle: string;
    date: string;
    time: string;
    quantity: number;
    totalAmount: number;
  }): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; }
            .order-details { background: white; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Подтверждение бронирования</h1>
            </div>
            <div class="content">
              <p>Здравствуйте!</p>
              <p>Ваше бронирование успешно подтверждено.</p>
              
              <div class="order-details">
                <h2>Детали заказа</h2>
                <div class="detail-row">
                  <span class="detail-label">Номер заказа:</span>
                  <span>${orderData.orderId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Тур:</span>
                  <span>${orderData.cardTitle}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Дата:</span>
                  <span>${orderData.date}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Время:</span>
                  <span>${orderData.time}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Количество участников:</span>
                  <span>${orderData.quantity}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Сумма:</span>
                  <span><strong>${orderData.totalAmount} ₽</strong></span>
                </div>
              </div>
              
              <p>До встречи!</p>
            </div>
            <div class="footer">
              <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
              <p>&copy; 2026 Travelio. Все права защищены.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: `Подтверждение бронирования #${orderData.orderId}`,
      html,
      text: `Ваше бронирование #${orderData.orderId} подтверждено. Тур: ${orderData.cardTitle}, Дата: ${orderData.date}, Время: ${orderData.time}, Сумма: ${orderData.totalAmount} ₽`,
    });
  }

  async sendPaymentSuccessNotification(userEmail: string, paymentData: {
    orderId: string;
    cardTitle: string;
    amount: number;
    paymentId: string;
  }): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; }
            .payment-details { background: white; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; }
            .success-badge { background: #10B981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Оплата прошла успешно!</h1>
            </div>
            <div class="content">
              <div style="text-align: center;">
                <span class="success-badge">Оплачено</span>
              </div>
              
              <p>Здравствуйте!</p>
              <p>Ваш платеж успешно обработан.</p>
              
              <div class="payment-details">
                <h2>Детали платежа</h2>
                <div class="detail-row">
                  <span class="detail-label">Номер заказа:</span>
                  <span>${paymentData.orderId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Тур:</span>
                  <span>${paymentData.cardTitle}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Сумма:</span>
                  <span><strong>${paymentData.amount} ₽</strong></span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">ID платежа:</span>
                  <span>${paymentData.paymentId}</span>
                </div>
              </div>
              
              <p>Спасибо за покупку! Мы отправили вам подробную информацию о бронировании.</p>
            </div>
            <div class="footer">
              <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
              <p>&copy; 2026 Travelio. Все права защищены.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: `Оплата успешно получена - Заказ #${paymentData.orderId}`,
      html,
      text: `Ваш платеж на сумму ${paymentData.amount} ₽ успешно обработан. Номер заказа: ${paymentData.orderId}`,
    });
  }

  async sendAdminOrderNotification(adminEmail: string, orderData: {
    orderId: string;
    cardTitle: string;
    userName: string;
    userEmail: string;
    userPhone?: string | null;
    date: string;
    time: string;
    quantity: number;
    totalAmount: number;
    isPaid?: boolean;
  }): Promise<void> {
    const statusLabel = orderData.isPaid
      ? '<span style="background:#10B981;color:white;padding:4px 12px;border-radius:12px;font-size:13px;">✓ Оплачен</span>'
      : '<span style="background:#F59E0B;color:white;padding:4px 12px;border-radius:12px;font-size:13px;">⏳ Предзаказ (ожидает оплаты)</span>';
    const headerColor = orderData.isPaid ? '#10B981' : '#EF4444';
    const headerText = orderData.isPaid ? '💳 Заказ оплачен!' : '🎫 Новый предзаказ';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${headerColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { font-weight: bold; color: #6b7280; font-size: 13px; }
            .detail-value { font-size: 13px; }
            .footer { text-align: center; padding: 15px; font-size: 11px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;font-size:22px;">${headerText}</h1>
            </div>
            <div class="content">
              <div style="text-align:center;margin:10px 0;">${statusLabel}</div>
              <div class="order-details">
                <div class="detail-row">
                  <span class="detail-label">Номер заказа:</span>
                  <span class="detail-value">#${orderData.orderId.slice(-8).toUpperCase()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Тур:</span>
                  <span class="detail-value">${orderData.cardTitle}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Клиент:</span>
                  <span class="detail-value">${orderData.userName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${orderData.userEmail}</span>
                </div>
                ${orderData.userPhone ? `<div class="detail-row"><span class="detail-label">Телефон:</span><span class="detail-value">${orderData.userPhone}</span></div>` : ''}
                <div class="detail-row">
                  <span class="detail-label">Дата:</span>
                  <span class="detail-value">${orderData.date}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Время:</span>
                  <span class="detail-value">${orderData.time}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Участников:</span>
                  <span class="detail-value">${orderData.quantity}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Сумма:</span>
                  <span class="detail-value"><strong>${orderData.totalAmount} ₽</strong></span>
                </div>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Сезон приключений</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: adminEmail,
      subject: orderData.isPaid
        ? `✅ Оплачен заказ #${orderData.orderId.slice(-8).toUpperCase()} — ${orderData.cardTitle}`
        : `🆕 Новый заказ #${orderData.orderId.slice(-8).toUpperCase()} — ${orderData.cardTitle}`,
      html,
      text: `${orderData.isPaid ? 'Оплачен' : 'Новый'} заказ. Клиент: ${orderData.userName} (${orderData.userEmail}${orderData.userPhone ? ', ' + orderData.userPhone : ''}). Тур: ${orderData.cardTitle}. Дата: ${orderData.date}. Сумма: ${orderData.totalAmount} ₽`,
    });
  }
}
