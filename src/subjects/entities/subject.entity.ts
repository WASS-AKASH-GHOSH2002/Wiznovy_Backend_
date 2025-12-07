import { DefaultStatus } from "src/enum";
import { TutorDetail } from "src/tutor-details/entities/tutor-detail.entity";
import { Course } from "src/course/entities/course.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Subject {
 @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  
  @Column({ type: 'text', nullable: true })
  image: string;

  @Column({ type: 'text', nullable: true })
  imagePath: string;

   
   @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.ACTIVE })
  status: DefaultStatus;

   @CreateDateColumn()
   createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;

@OneToMany(() => TutorDetail, (tutorDetail) => tutorDetail.subject)
  tutorDetails: TutorDetail[];

@OneToMany(() => Course, (course) => course.subject)
  courses: Course[];



}
