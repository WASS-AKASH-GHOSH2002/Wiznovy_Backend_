
import { Course } from 'src/course/entities/course.entity';
import { DefaultStatus } from 'src/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VideoLecture } from 'src/video-lecture/entities/video-lecture.entity';
import { UserProgress } from 'src/user-progress/entities/user-progress.entity';
import { StudyMaterial } from 'src/study-material/entities/study-material.entity';

@Entity()
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  imgUrl: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  imgPath: string;


  @Column({ type: 'uuid', nullable: true })
  courseId: string;

  @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.PENDING })
  status: DefaultStatus;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;


  @ManyToOne(() => Course, (course) => course.units, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  course: Course;

  @OneToMany(() => VideoLecture, (videoLecture) => videoLecture.unit)
  videoLectures: VideoLecture[];

  @OneToMany(() => StudyMaterial, (studyMaterial) => studyMaterial.unit)
  studyMaterials: StudyMaterial[];

  @OneToMany(() => UserProgress, (userProgress) => userProgress.unit)
  userProgress: UserProgress[];
}