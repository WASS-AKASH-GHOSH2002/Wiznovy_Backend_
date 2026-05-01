import { DefaultStatus } from 'src/enum';
import { Subject } from 'src/subjects/entities/subject.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tutor_subject')
export class TutorSubject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tutorId: string;

  @Column({ type: 'uuid' })
  subjectId: string;

  @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.PENDING })
  status: DefaultStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => TutorDetail, (tutor) => tutor.tutorSubjects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tutorId' })
  tutor: TutorDetail;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;
}
