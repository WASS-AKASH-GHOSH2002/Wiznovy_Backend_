import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from 'src/account/entities/account.entity';
import { decimalTransformer } from 'src/utils/decimal.transformer';

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, nullable: true, unique: true })
  walletId: string;
  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  balance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  totalEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  totalWithdrawals: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account: Account;
}


