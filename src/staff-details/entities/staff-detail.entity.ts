import { Account } from 'src/account/entities/account.entity';
import { Designation } from 'src/designations/entities/designation.entity';
import { Gender } from 'src/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
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

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  staffId: string;

  @Column({ type: 'uuid', nullable: true })
  designationId: string;

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

  @ManyToOne(() => Designation, (designation) => designation.staffDetails, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'designationId' })
  designation: Designation;
}
