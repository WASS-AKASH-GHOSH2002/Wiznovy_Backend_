import { DefaultStatus, FaqType } from 'src/enum';
import {
  Column,
  CreateDateColumn,
  Entity,

  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Faq {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  question: string;

  @Column({ type: 'text', nullable: true })
  answer: string;

  @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.ACTIVE })
  status: DefaultStatus;

  @Column({ type: 'enum', enum: FaqType, default: FaqType.USER })
  type: FaqType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
