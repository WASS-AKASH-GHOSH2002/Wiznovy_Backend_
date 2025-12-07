import { Account } from 'src/account/entities/account.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { SessionStatus, TimeSlot, SessionDurationType } from 'src/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class FixedSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  tutorId: string;

  @Column({ type: 'date' })
  sessionDate: Date;

  @Column({ type: 'enum', enum: TimeSlot })
  timeSlot: TimeSlot;

  @Column({ type: 'enum', enum: SessionDurationType })
  duration: SessionDurationType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'uuid', nullable: true })
  purchaseId: string;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.SCHEDULED })
  status: SessionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  user: Account;

  @ManyToOne(() => TutorDetail, { onDelete: 'CASCADE' })
  tutor: TutorDetail;
}