import { Account } from 'src/account/entities/account.entity';
import { Course } from 'src/course/entities/course.entity';
import { Unit } from 'src/unit/entities/unit.entity';
import { StudyMaterial } from 'src/study-material/entities/study-material.entity';
import { Session } from 'src/session/entities/session.entity';
import { PaymentStatus, PurchaseType, DefaultStatus } from 'src/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
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

  @Column({ type: 'enum', enum: PurchaseType })
  purchaseType: PurchaseType;

  @Column({ type: 'uuid', nullable: true })
  courseId: string;

  @Column({ type: 'uuid', nullable: true })
  videoLectureId: string;

  @Column({ type: 'uuid', nullable: true })
  studyMaterialId: string;


  @Column({ type: 'uuid', nullable: true })
  unitId: string;

  @Column({ type: 'uuid', nullable: true })
  sessionId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  merchantOrderId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  couponCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentIntentId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripePaymentIntentId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripeChargeId: string;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.ACTIVE })
  status: DefaultStatus;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account, (account) => account.userPurchases, { onDelete: 'CASCADE' })
  account: Account;

  @ManyToOne(() => Course, { nullable: true })
  course: Course;


  @ManyToOne(() => StudyMaterial, { nullable: true })
  studyMaterial: StudyMaterial;

  @ManyToOne(() => Unit, { nullable: true })
  unit: Unit;

  @ManyToOne(() => Session, { nullable: true })
  session: Session;
}