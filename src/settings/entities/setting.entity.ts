import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';


@Entity()
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  title: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  user_domain: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  admin_domain: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  mobile_domain: string;

  @Column({type: 'text', nullable: true})
  logo: string;

  @Column({type: 'text', nullable: true})
  logoPath: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  facebook: string;
 
  @Column({ type: 'varchar', length: 500, nullable: true })
  linkedIn: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  twitter: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  instagram: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  whatsApp: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
