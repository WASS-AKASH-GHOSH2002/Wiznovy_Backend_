import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Permission } from './entities/permission.entity';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission]),
    AuthModule,
    CacheModule.register(),
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
