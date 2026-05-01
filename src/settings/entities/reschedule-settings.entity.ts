import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class RescheduleSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

 @Column({ type: 'int', nullable: true })
reschedule_early_threshold_hours: number;

@Column({ type: 'int', nullable: true })
reschedule_mid_threshold_hours: number;

@Column({ type: 'int', nullable: true })
reschedule_block_threshold_hours: number;

@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
reschedule_early_fee_percent: number;

@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
reschedule_mid_fee_percent: number;

@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
reschedule_late_fee_percent: number;

@Column({ type: 'int', nullable: true })
max_reschedules_per_session: number;

@Column({ type: 'varchar', length: 50, nullable: true })
reschedule_fee_destination: string;

@Column({ type: 'int', nullable: true })
max_advance_booking_days: number;

@Column({ type: 'int', nullable: true })
tutor_reschedule_min_notice_hours: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
