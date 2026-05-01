import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class SessionSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

 @Column({ type: 'int', nullable: true })
trial_duration_minutes: number;

@Column({ type: 'int', nullable: true })
regular_session_duration_minutes: number;

@Column({ type: 'int', nullable: true })
session_buffer_minutes: number;

@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
trial_commission_percent: number;

@Column({ type: 'int', nullable: true })
max_trials_per_student_tutor: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
