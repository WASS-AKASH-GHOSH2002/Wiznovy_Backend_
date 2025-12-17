import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Cache } from 'cache-manager';
import { Account } from 'src/account/entities/account.entity';
import { DefaultStatus,  LoginType, UserRole } from 'src/enum';
import { UserDetail } from 'src/user-details/entities/user-detail.entity';
import { UserPermission } from 'src/user-permissions/entities/user-permission.entity';
import APIFeatures from 'src/utils/apiFeatures.utils';
import {  Repository } from 'typeorm';
import {
  ForgotPassDto,
  UserLoginDto,
  UserRegisterDto,
} from './dto/login.dto';
import { NodeMailerService } from 'src/node-mailer/node-mailer.service';
import { LoginHistoryService } from 'src/login-history/login-history.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Account) private readonly repo: Repository<Account>,
    @InjectRepository(UserPermission)
    private readonly upRepo: Repository<UserPermission>,
    @InjectRepository(UserDetail)
    private readonly userDetailRepo: Repository<UserDetail>,
     @InjectRepository(TutorDetail)
    private readonly tutordetailRepo: Repository<TutorDetail>,
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly nodeMailerService: NodeMailerService,
    private readonly loginHistoryService: LoginHistoryService,
    private readonly notificationsService: NotificationsService,

  ) { }

  async signIn(loginId: string, password: string, ip?: string) {
    const admin = await this.getUserDetails(loginId, UserRole.ADMIN);
    
    if (admin.lockedUntil && new Date() < admin.lockedUntil) {
      const unlockTime = new Date(admin.lockedUntil).toLocaleString();
      throw new UnauthorizedException(`Account is locked until ${unlockTime}`);
    }
    
    const comparePassword = await bcrypt.compare(password, admin.password);
    if (!comparePassword) {
      await this.handleFailedLogin(admin);
      throw new UnauthorizedException('Invalid Credentials');
    }
    
   const otp = randomInt(100000, 1000000).toString();
    await this.cacheManager.set(`admin_login_${admin.email}`, {
      otp,
      adminId: admin.id,
      ip: ip || 'unknown'
    }, 2 * 60 * 1000);
    
    await this.nodeMailerService.sendOtpInEmail(admin.email, otp);
    
    return { 
      message: 'OTP sent to your email for login verification',
      email: admin.email,
      requiresOtp: true
    };
  }

  async verifyAdminLoginOtp(email: string, otp: string) {
    const cacheKey = `admin_login_${email}`;
    const cachedData = await this.cacheManager.get<any>(cacheKey);
    
    if (!cachedData) {
      throw new BadRequestException('OTP expired or not found');
    }
    
    if (String(cachedData.otp).trim() !== String(otp).trim()) {
      throw new BadRequestException('Invalid OTP');
    }
    
    const admin = await this.repo.findOne({ where: { id: cachedData.adminId } });
    
    if (admin.failedLoginAttempts > 0) {
      admin.failedLoginAttempts = 0;
      admin.lockedUntil = null;
      await this.repo.save(admin);
    }
    
    await this.loginHistoryService.recordLogin(admin.id, cachedData.ip);
    await this.cacheManager.del(cacheKey);
    
    const token = await APIFeatures.assignJwtToken(admin.id, this.jwtService);
    return { token, email: admin.email, role: admin.roles };
  }

  async verifyRegistrationOtp(email: string, otp: string, ip: string) {
    return this.verifyRegistrationOtpInternal(email, otp, ip, 'user');
  }

  async verifyTutorRegistrationOtp(email: string, otp: string, ip: string) {
    return this.verifyRegistrationOtpInternal(email, otp, ip, 'tutor');
  }

  private async verifyRegistrationOtpInternal(email: string, otp: string, ip: string, type: 'user' | 'tutor') {
    const trimmedEmail = email.trim();
    const userDataKey = `${type}_registration_data_${trimmedEmail}`;
    const otpKey = `${type}_registration_otp_${trimmedEmail}`;
    
    const cachedData = await this.cacheManager.get<any>(userDataKey);
    const storedOtp = await this.cacheManager.get<string>(otpKey);
    
    if (!cachedData) {
      throw new BadRequestException(`${type.charAt(0).toUpperCase() + type.slice(1)} registration data not found`);
    }
    
    if (!storedOtp) {
      throw new BadRequestException('OTP expired');
    }
    
    if (String(storedOtp).trim() !== String(otp).trim()) {
      throw new BadRequestException('Invalid OTP');
    }

    const accountData = {
      email: cachedData.email,
      password: await bcrypt.hash(cachedData.password, 10),
      roles: type === 'user' ? UserRole.USER : UserRole.TUTOR,
      phoneNumber: cachedData.phoneNumber,
      ...(type === 'tutor' && { status: DefaultStatus.PENDING })
    };
    
    const account = await this.repo.save(Object.create(accountData));

    if (type === 'user') {
      const userDetail = Object.create({
        accountId: account.id,
        name: cachedData.name,
      });
      await this.userDetailRepo.save(userDetail);
      await this.nodeMailerService.welcomeMail(cachedData.email, cachedData.name, new Date().toISOString());
    } else {
      const tutorId = await this.generateTutorId();
      const tutorDetail = Object.create({
        accountId: account.id,
        name: cachedData.name,
        tutorId: tutorId,
      });
      await this.tutordetailRepo.save(tutorDetail);
      await this.nodeMailerService.tutorRegistrationMail(cachedData.email, cachedData.name, new Date().toISOString());
    }

    await this.cacheManager.del(userDataKey);
    await this.cacheManager.del(otpKey);
    
    await this.loginHistoryService.recordLogin(account.id, ip);
    const token = await APIFeatures.assignJwtToken(account.id, this.jwtService);

    return {
      account,
      token,
      message: type === 'user' ? 'Registration completed successfully' : 'your account is Under Review'
    };
  }

  async sendRegistrationOtp(email: string, userData: any) {
    return this.sendRegistrationOtpInternal(email, userData, 'user');
  }

  async resendRegistrationOtp(email: string) {
    return this.resendRegistrationOtpInternal(email, 'user');
  }

  async userRegister(dto: UserRegisterDto) {
    const { email, name, password, phoneNumber } = this.sanitizeUserData(dto);
    
    await this.checkUserExists(email, phoneNumber, UserRole.USER, 'User');

    return this.sendRegistrationOtp(email, {
      email, name, password, phoneNumber
    });
  }

  async userLogin(dto: UserLoginDto) {
    const user = await this.findUserByEmailAndRole(dto.email, UserRole.USER, 'userDetail');
    
    if (!user) {
      throw new NotFoundException('EmailId does not exists. Please register first!');
    }

    this.validateAccountStatus(user, 'user');
    await this.validatePassword(dto.password, user.password);

    await this.loginHistoryService.recordLogin(user.id, dto.ip);
    const token = await APIFeatures.assignJwtToken(user.id, this.jwtService);
    return { token: token, name: user.userDetail['name'] };
  }

  async forgotPass(dto: ForgotPassDto) {
    const user = await this.repo
      .createQueryBuilder('account')
      .where(
        'account.email = :email AND account.roles = :roles AND account.status = :status',
        {
          email: dto.email,
          roles: dto.role,
          status: DefaultStatus.ACTIVE,
        },
      )
      .getOne();
    if (!user) {
      throw new NotFoundException(
        'Email does not exist. Please register first!',
      );
    }
    const otp = randomInt(100000, 1000000).toString();
    await this.cacheManager.set(dto.email, otp, 2 * 60 * 1000);
    try {
      await this.nodeMailerService.sendOtpInEmail(dto.email, otp);
      return { email: dto.email, message: 'OTP sent to your email address' };
    } catch (error) {
      this.logger.error('Failed to send forgot password OTP:', error);
      throw new BadRequestException('Failed to send OTP email. Please try again.');
    }
  }

  async verifyOtp(email: string, otp: string) {
    const storedOtp = await this.cacheManager.get<string>(email);
    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    return { matched: true, message: 'OTP Matched.' };
  }

  async resetPassword(dto: ForgotPassDto) {
    const user = await this.repo
      .createQueryBuilder('account')
      .where(
        'account.email = :email AND account.roles = :roles AND account.status = :status',
        {
          email: dto.email,
          roles:dto.role,
          status: DefaultStatus.ACTIVE,
        },
      )
      .getOne();
    if (!user) {
      throw new NotFoundException(
        'Email does not exist. Please register first!',
      );
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password cannot be the same as current password');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashedPassword;

    await this.repo.save(user);
    await this.cacheManager.del(dto.email);

    return { message: 'Password reset successfully' };
  }

  validate(id: string) {
    return this.getUserDetails(id);
  }

  findPermission(accountId: string) {
    return this.getPermissions(accountId);
  }

  private readonly getPermissions = async (accountId: string): Promise<any> => {
    let result = await this.cacheManager.get('userPermission' + accountId);
    if (!result) {
      result = await this.upRepo.find({
        relations: ['permission', 'menu'],
        where: { accountId, status: true },
      });
      this.cacheManager.set(
        'userPermission' + accountId,
        result,
        7 * 24 * 60 * 60 * 1000,
      );
    }
    return result;
  };

  private readonly getUserDetails = async (
    id: string,
    role?: UserRole,
  ): Promise<any> => {
    const query = this.repo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.userDetail', 'userDetail')
      .leftJoinAndSelect('account.staffDetail', 'staffDetail')
      .where('account.id = :id OR account.email = :email', {
        id: id,
        email: id,
      });
    
    if (role === UserRole.USER) {
      query.andWhere('account.roles = :roles', { roles: UserRole.USER });
    } else if (role === UserRole.ADMIN) {
      query.andWhere('account.roles IN (:...roles)', {
        roles: [UserRole.ADMIN, UserRole.STAFF],
      });
    }
    
    const result = await query.getOne();
    if (!result) {
      throw new UnauthorizedException('Account not found!');
    }
    return result;
  };

  async validateOAuthLogin(email: string, name: string, picture: string, provider: LoginType = LoginType.GOOGLE): Promise<any> {
    let user = await this.repo.findOne({ 
      where: { email, roles: UserRole.USER },
      relations: ['userDetail']
    });

    if (!user) {
      const account = this.repo.create({ 
        email, 
        roles: UserRole.USER,
        loginType: provider,
        status: DefaultStatus.ACTIVE
      });
      user = await this.repo.save(account);

      const userDetail = this.userDetailRepo.create({
        accountId: user.id,
        name,
        profile: picture
      });
      await this.userDetailRepo.save(userDetail);
      user.userDetail = [userDetail];
    }

    const token = await APIFeatures.assignJwtToken(user.id, this.jwtService);
    return { token, user };
  }

  async sendTutorRegistrationOtp(email: string, userData: any) {
    return this.sendRegistrationOtpInternal(email, userData, 'tutor');
  }

  async resendTutorRegistrationOtp(email: string) {
    return this.resendRegistrationOtpInternal(email, 'tutor');
  }

  private async sendRegistrationOtpInternal(email: string, userData: any, type: 'user' | 'tutor' = 'user') {
    const otp = randomInt(100000, 1000000).toString();
    const userDataKey = `${type}_registration_data_${email}`;
    const otpKey = `${type}_registration_otp_${email}`;
    
    await this.cacheManager.set(userDataKey, userData, 0);
    await this.cacheManager.set(otpKey, otp, 2 * 60 * 1000);

    try {
      await this.nodeMailerService.sendOtpInEmail(email, otp);
      return {
        email: email,
        name: userData.name,
        message: `OTP sent to your email for ${type} registration verification`
      };
    } catch (error) {
      this.logger.error(`Failed to send ${type} registration OTP:`, error);
      throw new BadRequestException('Failed to send OTP email. Please try again.');
    }
  }

  private async resendRegistrationOtpInternal(email: string, type: 'user' | 'tutor' = 'user') {
    const userDataKey = `${type}_registration_data_${email}`;
    const cachedData = await this.cacheManager.get<any>(userDataKey);
    
    if (!cachedData) {
      throw new BadRequestException(`No pending ${type} registration found for this email`);
    }

    const otp = randomInt(100000, 1000000).toString();
    const otpKey = `${type}_registration_otp_${email}`;
    await this.cacheManager.set(otpKey, otp, 2 * 60 * 1000);

    try {
      await this.nodeMailerService.sendOtpInEmail(email, otp);
      return {
        email: email,
        name: cachedData.name,
        message: `OTP sent to your email for ${type} registration verification`
      };
    } catch (error) {
      this.logger.error(`Failed to resend ${type} registration OTP:`, error);
      throw new BadRequestException('Failed to send OTP email. Please try again.');
    }
  }



  async tutorRegister(dto: UserRegisterDto) {
    const { email, name, password, phoneNumber } = this.sanitizeUserData(dto);
    
    await this.checkUserExists(email, phoneNumber, UserRole.TUTOR, 'Tutor');

    return this.sendTutorRegistrationOtp(email, {
      email, name, password, phoneNumber
    });
  }

  private sanitizeUserData(dto: UserRegisterDto) {
    return {
      email: dto.email.trim(),
      name: dto.name.trim(),
      password: dto.password.trim(),
      phoneNumber: dto.phoneNumber.trim()
    };
  }

  private async checkUserExists(email: string, phoneNumber: string, role: UserRole, roleLabel: string) {
    const existingUser = await this.repo
      .createQueryBuilder('account')
      .where('(account.email = :email OR account.phoneNumber = :phoneNumber) AND account.roles = :roles', {
        email,
        phoneNumber,
        roles: role,
      })
      .getOne();
      
    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException(`${roleLabel} account with this email already exists!`);
      }
      if (existingUser.phoneNumber === phoneNumber) {
        throw new ConflictException(`${roleLabel} account with this phone number already exists!`);
      }
    }
  }

  async tutorLogin(dto: UserLoginDto) {
    const tutor = await this.findUserByEmailAndRole(dto.email, UserRole.TUTOR, 'tutorDetail');
    
    if (!tutor) {
      throw new NotFoundException('Tutor account does not exist. Please register first!');
    }

    this.validateAccountStatus(tutor, 'tutor');
    await this.validatePassword(dto.password, tutor.password);

    await this.loginHistoryService.recordLogin(tutor.id, dto.ip);
    const token = await APIFeatures.assignJwtToken(tutor.id, this.jwtService);
    return { token: token, name: tutor.tutorDetail['name'] };
  }

  private async findUserByEmailAndRole(email: string, role: UserRole, relation?: string) {
    const query = this.repo
      .createQueryBuilder('account')
      .where('account.email = :email AND account.roles = :roles', {
        email,
        roles: role,
      });
    
    if (relation) {
      query.leftJoinAndSelect(`account.${relation}`, relation);
    }
    
    return query.getOne();
  }

  private validateAccountStatus(account: any, accountType: string) {
    if (account.status !== DefaultStatus.ACTIVE) {
      const statusMessages = {
        [DefaultStatus.PENDING]: `Your ${accountType} account is pending approval. Please contact admin.`,
        [DefaultStatus.DEACTIVE]: `Your ${accountType} account is deactivated. Please contact admin.`,
        [DefaultStatus.SUSPENDED]: `Your ${accountType} account is suspended. Please contact admin.`,
        [DefaultStatus.DELETED]: `Your ${accountType} account has been deleted. Please contact admin.`
      };
      throw new UnauthorizedException(
        `Login not available. Status: ${account.status}. ${statusMessages[account.status]}`
      );
    }
  }

  private async validatePassword(inputPassword: string, storedPassword: string) {
    const comparePassword = await bcrypt.compare(inputPassword, storedPassword);
    if (!comparePassword) {
      throw new UnauthorizedException('Password mismatched!!');
    }
  }

  
  
  async logout(accountId: string, ip: string) {
    await this.loginHistoryService.recordLogout(accountId, ip);
    await this.cacheManager.del(accountId);
    return { message: 'Logged out successfully' };
  }

  private async handleFailedLogin(account: Account) {
    account.failedLoginAttempts = (account.failedLoginAttempts || 0) + 1;
    
    if (account.failedLoginAttempts >= 5) {
      account.lockedUntil = new Date(Date.now() + 10 * 60 * 1000); 
      await this.nodeMailerService.sendAccountLockNotification(account.email, account.lockedUntil);
    }
    
    await this.repo.save(account);
  }
private async generateTutorId(): Promise<string> {
  const today = new Date();
  // eslint-disable-next-line sonarjs/prefer-string-replace-all
  const dateStr = today.toLocaleDateString('en-CA').replace(/-/g, '');
  const prefix = 'WIZ';

  
  const lastTutor = await this.tutordetailRepo
    .createQueryBuilder('tutor')
    .where('tutor.tutorId LIKE :pattern', { pattern: `${prefix}%/%` }) 
    .orderBy('tutor.tutorId', 'DESC')
    .getOne();

  let sequence = 1001; 

  if (lastTutor?.tutorId) {
    
    const lastSequence = Number.parseInt(lastTutor.tutorId.split('/')[1], 10);
    if (!Number.isNaN(lastSequence)) {
      sequence = lastSequence + 1; 
    }
  }

  return `${prefix}${dateStr}/${sequence}`;
}



}