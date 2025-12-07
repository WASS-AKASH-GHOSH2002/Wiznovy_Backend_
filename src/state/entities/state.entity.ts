import { DefaultStatus } from 'src/enum';
import { Country } from 'src/country/entities/country.entity';
import { City } from 'src/city/entities/city.entity';
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

@Entity()
export class State {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  code: string;

  @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.ACTIVE })
  status: DefaultStatus;

  @Column({ type: 'uuid', nullable: true })
  countryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Country, (country) => country.states, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  country: Country;

  @OneToMany(() => City, (city) => city.state)
  cities: City[];

  @OneToMany(() => TutorDetail, (tutorDetail) => tutorDetail.state)
  tutorDetails: TutorDetail[];
}
