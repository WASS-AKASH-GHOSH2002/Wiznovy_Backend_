import { DefaultStatus } from 'src/enum';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { UserDetail } from 'src/user-details/entities/user-detail.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Qualification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.ACTIVE })
  status: DefaultStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserDetail, (userDetail) => userDetail.qualification)
  userDetails: UserDetail[];

  @OneToMany(() => TutorDetail, (tutorDetail) => tutorDetail.qualification)
  tutorDetails: TutorDetail[];
}
