import { Account } from 'src/account/entities/account.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ContactUs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  accountId: string;

  @Column({ type: 'varchar', length: 55, nullable: true })
  firstName: string;

 @Column({ type: 'varchar', length: 55, nullable: true })
  LastName: string;

  
  @Column({ type: 'varchar', length:100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  code: string;

  
  @Column({ type: 'varchar', length: 100, nullable: true })
  message: string;


  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Account, (account) => account.contactUs, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  account: Account[];
}
