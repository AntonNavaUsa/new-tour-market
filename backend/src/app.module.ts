import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CardsModule } from './cards/cards.module';
import { TicketsModule } from './tickets/tickets.module';
import { SchedulesModule } from './schedules/schedules.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { GuidesModule } from './guides/guides.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FilesModule } from './files/files.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    
    // Database
    PrismaModule,
    
    // Feature modules
    AuthModule,
    CardsModule,
    TicketsModule,
    SchedulesModule,
    OrdersModule,
    PaymentsModule,
    GuidesModule,
    ReviewsModule,
    FilesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
