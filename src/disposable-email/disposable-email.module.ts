import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { DisposableEmailService } from './disposable-email.service';
import { DisposableEmailController } from './disposable-email.controller';
import { DisposableEmailDomain } from './entities/disposable-email-domain.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DisposableEmailDomain]),
    CacheModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [DisposableEmailController],
  providers: [DisposableEmailService],
  exports: [DisposableEmailService],
})
export class DisposableEmailModule {}