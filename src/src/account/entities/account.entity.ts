import { ContactUs } from 'src/contact-us/entities/contact-us.entity';
import {  DefaultStatus, LoginType, UserRole } from 'src/enum';
import { LoginHistory } from 'src/login-history/entities/login-history.entity';
import { Notification } from 'src/notifications/entities/notification.entity';
import { RatingFeedback } from 'src/rating-feedback/entities/rating-feedback.entity';
import { Rating } from 'src/rating/entities/rating.entity';
import { StaffDetail } from 'src/staff-details/entities/staff-detail.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { UserDetail } from 'src/user-details/entities/user-detail.entity';
import { UserPermission } from 'src/user-permissions/entities/user-permission.entity';
import { UserProgress } from 'src/user-progress/entities/user-progress.entity';
import { UserPurchase } from 'src/user-purchase/entities/user-purchase.entity';

import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  password: string;

  // @Column({ type: 'varchar', length: 100, nullable: true })
  // deviceId: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  roles: UserRole;

  @Column({ type: 'enum', enum: LoginType, default: LoginType.EMAIL })
  loginType: LoginType;

  @Column({ type: 'enum', enum: DefaultStatus, default: DefaultStatus.ACTIVE })
  status: DefaultStatus;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripeCustomerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Notification, (notification) => notification.account)
  notification: Notification[];

  @OneToMany(() => UserPermission, (userPermission) => userPermission.account)
  userPermission: UserPermission[];

  @OneToOne(() => UserDetail, (userDetail) => userDetail.account)
  userDetail: UserDetail[];

  @OneToMany(() => StaffDetail, (staffDetail) => staffDetail.account)
  staffDetail: StaffDetail[];

  @OneToOne(() => TutorDetail, (tutorDetail) => tutorDetail.account)
  tutorDetail: TutorDetail[];


  @OneToMany(() => ContactUs, (contactUs) => contactUs.account)
  contactUs: ContactUs[];

  @OneToMany(() => RatingFeedback, (ratingFeedback) => ratingFeedback.account)
  ratingFeedback: RatingFeedback[];

  @OneToMany(() => LoginHistory, (loginHistory) => loginHistory.account, { cascade: true, onDelete: 'CASCADE' })
  loginHistory: LoginHistory[];

  @OneToMany(() => Rating, (rating) => rating.account)
  ratings: Rating[];


  @OneToMany(() => UserProgress, (userProgress) => userProgress.user)
  userProgress: UserProgress[];

  @OneToMany(() => UserPurchase, (userPurchase) => userPurchase.account)
  userPurchases: UserPurchase[];
}
