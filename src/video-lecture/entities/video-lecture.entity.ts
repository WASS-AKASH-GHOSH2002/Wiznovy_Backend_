import { Unit } from 'src/unit/entities/unit.entity';
import { StudyMaterial } from 'src/study-material/entities/study-material.entity';
import { DefaultStatus, } from 'src/enum';
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
export class VideoLecture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoPath: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailPath: string;

  @Column({ type: 'uuid' })
  unitId: string;

  @Column({ type: 'int', default: 0 })
  duration: number;
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Unit, (unit) => unit.videoLectures, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  unit: Unit;

  

  @OneToMany(() => StudyMaterial, (studyMaterial) => studyMaterial.videoLecture)
  studyMaterials: StudyMaterial[];
}