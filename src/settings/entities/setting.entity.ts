
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DefaultStatus } from '../../enum';

@Entity()
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true, default: process.env.RN_EMAIL })
  email: string;

  @Column({ type: 'text', nullable: true })
  domain: string;

  @Column({ type: 'text', nullable: true })
  logo: string;

  @Column({ type: 'text', nullable: true })
  logoPath: string;

  @Column({ type: 'text', nullable: true })
  wpLink: string;

  @Column({ type: 'text', nullable: true })
  fbLink: string;

  @Column({ type: 'text', nullable: true })
  instaLink: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  companyName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  companyCity: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  companyPhone: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  companyGstin: string;

  @Column({ type: 'int', default: 40, nullable: true })
  pdfMargin: number;

  @Column({ type: 'text', nullable: true })
  invoiceDeclaration: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.8 })
  gstPercentage: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0})
 sessionCommissionRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default:0.0})
  courseCommissionRate: number;

  @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.ACTIVE })
  status: DefaultStatus;

  @Column({ type: 'varchar', length: 10, default: 'en', nullable: true })
  language: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC', nullable: true })
  timezone: string;

  @Column({ type: 'varchar', length: 10, default: 'USD', nullable: true })
  currency: string;

  @Column({ type: 'text', nullable: true })
  zoomApiKey: string;

  @Column({ type: 'text', nullable: true })
  zoomApiSecret: string;

  @Column({ type: 'text', nullable: true })
  stripePublicKey: string;

  @Column({ type: 'text', nullable: true })
  stripeSecretKey: string;

  @Column({ type: 'boolean', default: false })
  zoomEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  stripeEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  emailHost: string;

  @Column({ type: 'int', nullable: true })
  emailPort: number;

  @Column({ type: 'text', nullable: true })
  emailUser: string;

  @Column({ type: 'text', nullable: true })
  emailPassword: string;

  @Column({ type: 'boolean', default: false })
  emailEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
