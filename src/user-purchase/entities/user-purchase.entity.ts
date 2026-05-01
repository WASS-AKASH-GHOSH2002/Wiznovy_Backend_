import { Account } from 'src/account/entities/account.entity';
import { Course } from 'src/course/entities/course.entity';
import { PaymentStatus, PaymentMethod } from 'src/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class UserPurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'uuid' })
  courseId: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  orderNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account, (account) => account.userPurchases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @ManyToOne(() => Course, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'courseId' })
  course: Course;
}
