import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { IsEmail } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

class SendTestEmailDto {
  @IsEmail()
  to: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async sendTestEmail(@Body() dto: SendTestEmailDto) {
    await this.notificationsService.sendEmail({
      to: dto.to,
      subject: '✅ Тестовое письмо — Сезон приключений',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
              .badge { background: #10B981; color: white; padding: 6px 16px; border-radius: 20px; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin:0;">Сезон приключений</h1>
              </div>
              <div class="content">
                <div style="text-align:center;margin:16px 0;">
                  <span class="badge">Отправка работает!</span>
                </div>
                <p>Это тестовое письмо. Если вы его получили — SMTP настроен правильно.</p>
                <p style="color:#6b7280;font-size:13px;">Отправлено: ${new Date().toLocaleString('ru-RU')}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Тестовое письмо от Сезон приключений. Если вы его получили — SMTP настроен правильно. Отправлено: ${new Date().toLocaleString('ru-RU')}`,
    });

    return { ok: true, message: `Письмо отправлено на ${dto.to}` };
  }
}
