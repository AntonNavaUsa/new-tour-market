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
      secure: false, // true for 465, false for other ports
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
            .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
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
              <h1>🎫 Новый заказ</h1>
            </div>
            <div class="content">
              <p>Получен новый заказ!</p>
              
              <div class="order-details">
                <h2>Информация о заказе</h2>
                <div class="detail-row">
                  <span class="detail-label">Номер заказа:</span>
                  <span>${orderData.orderId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Тур:</span>
                  <span>${orderData.cardTitle}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Клиент:</span>
                  <span>${orderData.userName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span>${orderData.userEmail}</span>
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
                  <span class="detail-label">Участников:</span>
                  <span>${orderData.quantity}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Сумма:</span>
                  <span><strong>${orderData.totalAmount} ₽</strong></span>
                </div>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2026 Travelio Admin Panel</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: adminEmail,
      subject: `Новый заказ #${orderData.orderId} - ${orderData.cardTitle}`,
      html,
      text: `Новый заказ #${orderData.orderId}. Клиент: ${orderData.userName} (${orderData.userEmail}). Тур: ${orderData.cardTitle}. Сумма: ${orderData.totalAmount} ₽`,
    });
  }
}
