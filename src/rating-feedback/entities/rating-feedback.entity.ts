import { Account } from 'src/account/entities/account.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class RatingFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  desc: string;

  @Column({ type: 'int', default: 0 })
  rating: string;

  @Column({ type: 'boolean', default: false })
  status: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  accountId: string;

  @ManyToOne(() => Account, (account) => account.ratingFeedback, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  account: Account[];
}
