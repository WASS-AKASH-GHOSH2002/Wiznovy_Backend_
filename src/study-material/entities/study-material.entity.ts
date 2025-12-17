import { VideoLecture } from 'src/video-lecture/entities/video-lecture.entity';
import { UserProgress } from 'src/user-progress/entities/user-progress.entity';
import { Unit } from 'src/unit/entities/unit.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class StudyMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fileUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath: string;

  @Column({ type: 'uuid', nullable: true })
  unitId: string;

  @Column({ type: 'uuid', nullable: true })
  videoLectureId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => VideoLecture, (videoLecture) => videoLecture.studyMaterials)
  videoLecture: VideoLecture;

  @ManyToOne(() => Unit, (unit) => unit.studyMaterials, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  unit: Unit;

  @OneToMany(() => UserProgress, (userProgress) => userProgress.studyMaterial)
  userProgress: UserProgress[];
}