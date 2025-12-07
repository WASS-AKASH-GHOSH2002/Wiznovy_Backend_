import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from 'src/account/entities/account.entity';
import { PaymentMethod, PayoutStatus } from 'src/enum';
@Entity()
export class TutorPayout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tutorId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  @Column({ type: 'text', nullable: true })
  paymentDetails: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'tutorId' })
  tutor: Account;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'approvedBy' })
  approver: Account;
}