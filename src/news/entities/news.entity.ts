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
export class News {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  heading: string;

  @Column({ type: 'text', nullable: true })
  desc: string;

  @Column({ type: 'text', nullable: true })
  image: string;

  @Column({ type: 'text', nullable: true })
  imagePath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
