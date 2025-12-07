import { Account } from 'src/account/entities/account.entity';
import { Gender } from 'src/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class StaffDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;
  
  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'date', nullable: true })
  dob: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ type: 'varchar', length: 20, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pin: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  accountId: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @ManyToOne(() => Account, (account) => account.staffDetail, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  account: Account[];
}
