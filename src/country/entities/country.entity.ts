import { DefaultStatus } from 'src/enum';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { UserDetail } from 'src/user-details/entities/user-detail.entity';
import { City } from 'src/city/entities/city.entity';
import { State } from 'src/state/entities/state.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  code: string;

  @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.ACTIVE })
  status: DefaultStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagePath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserDetail, (userDetail) => userDetail.country)
  userDetails: UserDetail[];

  @OneToMany(() => TutorDetail, (tutorDetail) => tutorDetail.country)
  tutorDetails: TutorDetail[];

  @OneToMany(() => State, (state) => state.country)
  states: State[];


}