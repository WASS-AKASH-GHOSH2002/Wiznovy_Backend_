import { BookStatus } from "src/enum";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { BookImage } from "./book-image.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Language } from "src/languages/entities/language.entity";
import { Account } from "src/account/entities/account.entity";

@Entity()
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  authorName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  coverImage: string;

  @Column({ type: 'text', nullable: true })
  coverImagePath: string;

  @Column({ type: 'text', nullable: true })
  pdfFile: string;

  @Column({ type: 'text', nullable: true })
  pdfFilePath: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  isbn: string;

  
  @Column({ type: 'int', nullable: true })
  totalPages: number;


  @OneToMany(() => BookImage, bookImage => bookImage.book)
  bookImages: BookImage[];

  @Column({ type: 'uuid', nullable: true })
  subjectId: string;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  @Column({ type: 'uuid', nullable: true })
  languageId: string;

  @ManyToOne(() => Language)
  @JoinColumn({ name: 'languageId' })
  language: Language;

  @Column({ type: 'enum', enum: BookStatus, default: BookStatus.PENDING })
  status: BookStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalRatings: number;

@Column({ type: 'uuid', nullable: true })
createdBy: string;

@ManyToOne(() => Account)
@JoinColumn({ name: 'createdBy' })
tutor: Account;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}