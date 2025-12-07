import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankDetailsService } from './bank-details.service';
import { BankDetailsController } from './bank-details.controller';
import { BankDetail } from './entities/bank-detail.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BankDetail]),
    AuthModule
  ],
  controllers: [BankDetailsController],
  providers: [BankDetailsService],
  exports: [BankDetailsService]
})
export class BankDetailsModule {}
