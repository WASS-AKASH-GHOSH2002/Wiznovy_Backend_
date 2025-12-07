import { State } from 'src/state/entities/state.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DefaultStatus } from 'src/enum';

@Entity()
export class City {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;


  @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.ACTIVE })
  status: DefaultStatus;

  @Column({ type: 'varchar', length: 36, nullable: true })
  stateId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => State, (state) => state.cities, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  state: State;

  @OneToMany(() => TutorDetail, (tutorDetail) => tutorDetail.city)
  tutorDetails: TutorDetail[];
}
