import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  
} from 'typeorm';
import { Account } from '../../account/entities/account.entity';
import { Book } from '../../book/entities/book.entity';

@Entity('saved_books')
        
export class SavedBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable:true })                             
  userId: string;

  @Column({ type: 'uuid', nullable:true })                            
  bookId: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })     
  user: Account;

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })     
  book: Book;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}
