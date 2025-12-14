
import { DefaultStatus } from "src/enum";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
id: string;

@Column({type:'varchar',length:255})
name: string;

@Column({type:'text', nullable:true})
image: string;

@Column({type:'text', nullable:true})
imagePath: string;

@Column({type:'enum', enum:DefaultStatus,default:DefaultStatus.PENDING})
status: DefaultStatus;


@CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;


}
