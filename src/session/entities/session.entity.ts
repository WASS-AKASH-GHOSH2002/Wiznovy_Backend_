import { Account } from 'src/account/entities/account.entity';
import { ZoomMeeting } from 'src/zoom/entities/zoom.entity';
import { SessionStatus, SessionType } from 'src/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  tutorId: string;

  @Column({ type: 'date' })
  sessionDate: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'uuid', nullable: true })
  purchaseId: string;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.SCHEDULED })
  status: SessionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'enum', enum: SessionType, default: SessionType.REGULAR })
  sessionType: SessionType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'uuid', nullable: true })
  cancelledBy: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  user: Account;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  tutor: Account;

  @OneToMany('Rating', 'session')
  ratings: any[];

  @OneToOne(() => ZoomMeeting, zoomMeeting => zoomMeeting.session)
  zoomMeeting: ZoomMeeting;
}