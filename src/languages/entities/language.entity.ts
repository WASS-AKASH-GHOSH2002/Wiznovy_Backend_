import { DefaultStatus } from 'src/enum';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { UserDetail } from 'src/user-details/entities/user-detail.entity';
import { Course } from 'src/course/entities/course.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Language {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.ACTIVE })
  status: DefaultStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserDetail, (userDetail) => userDetail.language)
    userDetails: UserDetail[];

  @OneToMany(() => TutorDetail, (tutorDetail) => tutorDetail.language)
    tutorDetails: TutorDetail[];

  @OneToMany(() => Course, (course) => course.language)
    courses: Course[];
}
