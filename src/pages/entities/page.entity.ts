import { PageType } from 'src/enum';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Page {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'enum', enum: PageType })
  pageType: PageType;

  @Column({ type: 'text' })
  desc: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imagePath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

