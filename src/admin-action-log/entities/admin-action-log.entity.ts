import { AdminActionType } from 'src/enum';
import { Account } from 'src/account/entities/account.entity';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('admin_action_logs')
export class AdminActionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  adminId: string;

  @Column({ nullable: true })
  role: string;

  @Column({ type: 'enum', enum: AdminActionType })
  actionType: AdminActionType;

  @Column({ nullable: true })
  targetId: string;

  @Column({ nullable: true })
  targetType: string;

  @Column({ type: 'json', nullable: true })
  oldData: any;

  @Column({ type: 'json', nullable: true })
  newData: any;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'adminId' })
  admin: Account;
}
