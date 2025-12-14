import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { UserDetail } from './entities/user-detail.entity';
import { UserDetailsController } from './user-details.controller';
import { UserDetailsService } from './user-details.service';
import { Account } from 'src/account/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserDetail,Account]),
    AuthModule,
    MulterModule.register({ dest: './uploads/UserDetail' }),
  ],
  controllers: [UserDetailsController],
  providers: [UserDetailsService],
  exports: [UserDetailsService],
})
export class UserDetailsModule {}
