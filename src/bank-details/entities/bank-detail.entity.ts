import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from 'src/account/entities/account.entity';

@Entity()
export class BankDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tutorId: string;

  @Column({ type: 'varchar', length: 50 })
  accountNo: string;

  @Column({ type: 'varchar', length: 100 })
  accountHolderName: string;

  @Column({ type: 'varchar', length: 20 })
  ifscCode: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  swiftCode: string;

  @Column({ type: 'varchar', length: 100 })
  bankName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  branchName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  passbookFile: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  passbookFilePath: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  documentFile: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  documentFilePath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'tutorId' })
  tutor: Account;
}
