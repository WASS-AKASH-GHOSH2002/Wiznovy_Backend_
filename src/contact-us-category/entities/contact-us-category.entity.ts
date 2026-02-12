import { DefaultStatus } from "src/enum";
import { ContactUs } from "src/contact-us/entities/contact-us.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class ContactUsCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'enum', enum:DefaultStatus, default: DefaultStatus.ACTIVE })
  status: DefaultStatus;

   @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;

  @OneToMany(() => ContactUs, (contactUs) => contactUs.category)
  contactUs: ContactUs[];
}
