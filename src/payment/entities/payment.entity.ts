import { Account } from 'src/account/entities/account.entity';
import { Course } from 'src/course/entities/course.entity';
import { Session } from 'src/session/entities/session.entity';
import { PaymentStatus, PurchaseType, DefaultStatus } from 'src/enum';
import { decimalTransformer } from 'src/utils/decimal.transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'enum', enum: PurchaseType })
  purchaseType: PurchaseType;

  @Column({ type: 'uuid', nullable: true })
  courseId: string;

  @Column({ type: 'uuid', nullable: true })
  sessionId: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  orderNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, transformer: decimalTransformer })
  originalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  discountAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  couponCode: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripePaymentIntentId: string;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.ACTIVE })
  status: DefaultStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  account: Account;

  @ManyToOne(() => Course, { nullable: true })
  course: Course;

  @ManyToOne(() => Session, { nullable: true })
  session: Session;
}
