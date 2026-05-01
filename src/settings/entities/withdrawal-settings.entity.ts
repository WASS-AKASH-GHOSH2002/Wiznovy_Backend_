import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class WithdrawalSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 10 })
  minWithdrawalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 5000 })
  maxWithdrawalPerRequest: number;

  @Column({ type: 'int', default: 24 })
  cooldownPeriodHours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 10000 })
  weeklyWithdrawalCap: number;

  @Column({ type: 'int', default: 7 })
  earningsHoldPeriodDays: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  autoDisbursementThreshold: number;

  @Column({ type: 'int', nullable: true, comment: 'Days after which auto disbursement triggers' })
  autoDisbursementAfter: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
