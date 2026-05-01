import { Account } from 'src/account/entities/account.entity';
import { Budget } from 'src/budget/entities/budget.entity';
import { City } from 'src/city/entities/city.entity';
import { Country } from 'src/country/entities/country.entity';
import { Gender, Level, LanguageProficiency } from 'src/enum';
import { Language } from 'src/languages/entities/language.entity';
import { Qualification } from 'src/qualification/entities/qualification.entity';
import { State } from 'src/state/entities/state.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { TutorSubject } from './tutor-subject.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';


@Entity('tutor_detail')
export class TutorDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length:100, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  tutorId: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ type: 'enum', enum: Level, })
  expertiseLevel: Level;
 
  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ type: 'text', nullable: true })
  profileImage: string;

  @Column({ type: 'text', nullable: true })
  profileImagePath: string;

  @Column({ type: 'text', nullable: true })
  document: string;

  @Column({ type: 'text', nullable: true })
  documentName:string;

  @Column({ type: 'text', nullable: true })
  qualificationCertification: string;

  @Column({ type: 'text', nullable: true })
  qualificationCertificationName: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalRatings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0, transformer: { to: (v) => v, from: (v) => parseFloat(Number(v).toFixed(2)) } })
  hourlyRate: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0, transformer: { to: (v) => v, from: (v) => parseFloat(Number(v).toFixed(2)) } })
  trailRate: number;

  @Column({ type: 'text', nullable: true })
  introductionVideo: string;

  @Column({ type: 'text', nullable: true })
  introductionVideoPath: string;

  @Column({ type: 'int', nullable: true, comment: 'Years of teaching experience' })
  teachingExperience: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  accountId: string;

  @Column({ type: 'uuid', nullable: true })
  cityId: string;

  @Column({ type: 'uuid', nullable: true })
  stateId: string;

  @Column({ type: 'uuid', nullable: true })
  subjectId: string;

  @Column({ type: 'uuid', nullable: true })
  countryId: string;

  @Column({ type: 'uuid', nullable: true })
  languageId: string;

  @Column({ type: 'enum', enum: LanguageProficiency, nullable: true })
  languageProficiency: LanguageProficiency;

  @Column({ type: 'uuid', nullable: true })
  qualificationId: string;

  @Column({ type: 'uuid', nullable: true })
  budgetId: string;


  @OneToOne(() => Account, (account) => account.tutorDetail, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @ManyToOne(() => Subject, (subject) => subject.tutorDetails, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  subject: Subject;

  @OneToMany(() => TutorSubject, (ts) => ts.tutor)
  tutorSubjects: TutorSubject[];

    @ManyToOne(() => City, (city) => city.tutorDetails, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  city: City;

  @ManyToOne(() => State, (state) => state.tutorDetails, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  state: State;

  @ManyToOne(() => Country, (country) => country.tutorDetails, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  country: Country;

  @ManyToOne(() => Language, (language) => language.tutorDetails, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  language: Language;

  

  @ManyToOne(() => Qualification, (qualification) => qualification.tutorDetails, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  qualification: Qualification;

  @ManyToOne(() => Budget, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'budgetId' })
  budget: Budget;
}