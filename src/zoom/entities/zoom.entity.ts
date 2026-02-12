import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Session } from 'src/session/entities/session.entity';

@Entity('zoom_meetings')
export class ZoomMeeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'varchar', length: 100 })
  meetingId: string;

  @Column({ type: 'text' })
  joinUrl: string;

  @Column({ type: 'text' })
  startUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  topic: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  password: string;

  @Column({ type: 'datetime', nullable: true })
  startTime: Date;

  @Column({ type: 'int', default: 60 })
  duration: number;

  @Column({ type: 'varchar', length: 50, default: 'waiting' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: Session;
}