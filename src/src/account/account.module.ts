import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/auth/auth.module';
import { MenusModule } from 'src/menus/menus.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { UserPermissionsModule } from 'src/user-permissions/user-permissions.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { Account } from './entities/account.entity';
import { UserDetail } from 'src/user-details/entities/user-detail.entity';
import { NodeMailerModule } from 'src/node-mailer/node-mailer.module';
import { StaffDetail } from 'src/staff-details/entities/staff-detail.entity';
import { Menu } from 'src/menus/entities/menu.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, UserDetail, StaffDetail, Menu, TutorDetail]),
    AuthModule,
    MenusModule,
    PermissionsModule,
    UserPermissionsModule,
    NodeMailerModule,
  ],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
