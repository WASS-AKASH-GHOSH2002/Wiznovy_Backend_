import { Account } from 'src/account/entities/account.entity';
import { Course } from 'src/course/entities/course.entity';
import { Session } from 'src/session/entities/session.entity';

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
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  
  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'uuid', nullable: true })
  tutorId: string;

  @Column({ type: 'uuid', nullable: true })
  courseId: string;

  @Column({ type: 'uuid', nullable: true })
  sessionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account, (account) => account.ratings, { onDelete: 'CASCADE' })
  account: Account;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tutorId' })
  tutor: Account;

  @ManyToOne(() => Course, (course) => course.ratings, { onDelete: 'CASCADE' })
  course: Course;

  @ManyToOne(() => Session, (session) => session.ratings, { onDelete: 'SET NULL', nullable: true })
  session: Session;
}