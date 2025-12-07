
import { Account } from 'src/account/entities/account.entity';
import { Course } from 'src/course/entities/course.entity';
import { Unit } from 'src/unit/entities/unit.entity';
import { StudyMaterial } from 'src/study-material/entities/study-material.entity';


import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  courseId: string;

  @Column({ type: 'uuid', nullable: true })
  unitId: string;

  @Column({ type: 'uuid', nullable: true })
  studyMaterialId: string;

  @Column({ type: 'uuid', nullable: true })
  contentId: string;

  @Column({ type: 'varchar', length: 50 })
  contentType: string;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'int', default: 0 })
  value: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account, (account) => account.userProgress, { onDelete: 'CASCADE' })
  user: Account;

  @ManyToOne(() => Course, (course) => course.userProgress, { nullable: true, onDelete: 'CASCADE' })
  course: Course;

  @ManyToOne(() => Unit, (unit) => unit.userProgress, { nullable: true, onDelete: 'CASCADE' })
  unit: Unit;

  @ManyToOne(() => StudyMaterial, (studyMaterial) => studyMaterial.userProgress, { nullable: true, onDelete: 'CASCADE' })
  studyMaterial: StudyMaterial;
}
