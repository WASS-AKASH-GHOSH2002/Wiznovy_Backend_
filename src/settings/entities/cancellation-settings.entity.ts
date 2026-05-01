import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class CancellationSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

 @Column({ type: 'int', nullable: true })
early_cancel_threshold_hours: number;

@Column({ type: 'int', nullable: true })
mid_cancel_threshold_hours: number;

@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
early_cancel_refund_percent: number;

@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
mid_cancel_credit_percent: number;

@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
late_cancel_credit_percent: number;

@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
cancel_commission_percent: number;

@Column({ type: 'int', nullable: true })
tutor_self_cancel_min_notice_hours: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
