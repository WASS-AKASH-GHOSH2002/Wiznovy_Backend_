import { Account } from 'src/account/entities/account.entity';
import { Budget } from 'src/budget/entities/budget.entity';
import { Country } from 'src/country/entities/country.entity';
import {  Gender, Level } from 'src/enum';
import { Goal } from 'src/goal/entities/goal.entity';
import { Language } from 'src/languages/entities/language.entity';
import { Qualification } from 'src/qualification/entities/qualification.entity';
import { Topic } from 'src/topic/entities/topic.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class UserDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 55, nullable: true })
  name: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ type: 'enum', enum: Level, nullable: true })
  englishLevel: Level;

  @Column({ type: 'date', nullable: true })
  dob: Date;
  @Column({ type: 'varchar', length: 5000, nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  profile: string;

  @Column({ type: 'text', nullable: true })
  profileName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  accountId: string;

  @Column({ type: 'uuid', nullable: true })
  topicId: string;

  @Column({ type: 'uuid', nullable: true })
  goalId: string;

  @Column({ type: 'uuid', nullable: true })
  countryId: string;

  @Column({ type: 'uuid', nullable: true })
  languageId: string;

   @Column({ type: 'uuid', nullable: true })
  budgetId: string;

  @Column({ type: 'uuid', nullable: true })
  qualificationId: string;

  @OneToOne(() => Account, (account) => account.userDetail, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @ManyToOne(() => Topic, (topic) => topic.userDetails, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  topic: Topic;

  @ManyToOne(() => Goal, (goal) => goal.userDetails, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  goal: Goal;

  @ManyToOne(() => Country, (country) => country.userDetails, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  country: Country;

  @ManyToOne(() => Language, (language) => language.userDetails, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  language: Language;

  @ManyToOne(() => Budget, (budget) => budget.userDetails, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  budget: Budget;

  @ManyToOne(() => Qualification, (qualification) => qualification.userDetails, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  qualification: Qualification;
}
