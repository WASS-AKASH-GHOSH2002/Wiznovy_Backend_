import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Rating } from '../../rating/entities/rating.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Language } from '../../languages/entities/language.entity';
import { Class } from '../../class/entities/class.entity';
import { AccessTypes, CourseStatus } from '../../enum';
import { Unit } from '../../unit/entities/unit.entity';
import { UserProgress } from '../../user-progress/entities/user-progress.entity';
import { Account } from '../../account/entities/account.entity';


@Entity({ name: 'courses' })
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagepath: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailpath: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountPrice: number;

  @Column({ type: 'int', default: 365 })
  validityDays: number;

  @Column({ type: 'enum', enum: AccessTypes, default: AccessTypes.FREE })
  accessType: AccessTypes;

  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.PENDING })
  status: CourseStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  totalDuration: string;

  @Column({ type: 'int', default: 0 })
  totalLectures: number;

  @Column({ type: 'text', nullable: true })
  authorMessage: string;

@Column({ type: 'datetime', nullable: true })
startDate: Date;

@Column({ type: 'datetime', nullable: true })
endDate: Date;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalRatings: number;

  @Column({ type: 'int', default: 0 })
  totalPurchases: number;

  @Column({ type: 'uuid', nullable: true })
  subjectId: string;

  @Column({ type: 'uuid', nullable: true })
  languageId: string;

  @Column({ type: 'uuid', nullable: false })
  tutorId: string;

  @Column({ type: 'text', nullable: true })
  deletionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Subject, (subject) => subject.courses, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  subject: Subject;

  @ManyToOne(() => Language, (language) => language.courses, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  language: Language;

  @ManyToOne(() => Class, (classEntity) => classEntity.courses, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  class: Class;

  @OneToMany(() => Rating, (rating) => rating.course)
  ratings: Rating[];

  @OneToMany(() => Unit, (unit) => unit.course)
  units: Unit[];

  @OneToMany(() => UserProgress, (userProgress) => userProgress.course)
  userProgress: UserProgress[];

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  tutor: Account;
}
