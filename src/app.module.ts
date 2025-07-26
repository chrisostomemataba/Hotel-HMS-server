// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SentryModule } from '@sentry/nestjs/setup';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PosModule } from './pos/pos.module';
import { MenuModule } from './menu/menu.module';
import { InventoryModule } from './inventory/inventory.module';
import { StaffModule } from './staff/staff.module';
import { FinanceModule } from './finance/finance.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SentryModule.forRoot(),
    AuthModule,
    UsersModule,
    RolesModule,
    ReservationsModule,
    PosModule,
    MenuModule,
    InventoryModule,
    StaffModule,
    FinanceModule,
    DashboardModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}