import { DefaultStatus } from "src/enum";
import { TutorDetail } from "src/tutor-details/entities/tutor-detail.entity";
import { Course } from "src/course/entities/course.entity";
import { Book } from "src/book/entities/book.entity";
import { Account } from "src/account/entities/account.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity()
export class Subject {
 @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  image: string;

  @Column({ type: 'text', nullable: true })
  imagePath: string;

   
  @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.ACTIVE })
  status: DefaultStatus;

  @Column({ type: 'boolean', default: false })
  topSubject: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @ManyToOne(() => Account, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  creator: Account;

   @CreateDateColumn()
   createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;

@OneToMany(() => TutorDetail, (tutorDetail) => tutorDetail.subject)
  tutorDetails: TutorDetail[];



@OneToMany(() => Course, (course) => course.subject)
  courses: Course[];

@OneToMany(() => Book, (book) => book.subject)
  books: Book[];



}
