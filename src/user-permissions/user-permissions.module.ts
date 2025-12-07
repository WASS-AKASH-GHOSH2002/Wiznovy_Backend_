import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { UserPermission } from './entities/user-permission.entity';
import { UserPermissionsController } from './user-permissions.controller';
import { UserPermissionsService } from './user-permissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPermission]), AuthModule],
  controllers: [UserPermissionsController],
  providers: [UserPermissionsService],
  exports: [UserPermissionsService],
})
export class UserPermissionsModule {}
