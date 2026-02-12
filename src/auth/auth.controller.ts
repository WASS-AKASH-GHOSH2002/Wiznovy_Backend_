import { Body, Controller,  Ip, Post, 
   UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AdminSigninDto,
  ForgotPassDto,
  UserLoginDto,
  UserRegisterDto,
  VerifyOtpDto,
  ResendUserOtpDto,
  ResendTutorOtpDto,
  GoogleLoginDto,
} from './dto/login.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { AuthGuard } from '@nestjs/passport';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiBearerAuth 
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('admin/login')
  @ApiOperation({ summary: 'Admin login - sends OTP to email' })
  @ApiBody({ type: AdminSigninDto })
  @ApiResponse({ status: 200, description: 'OTP sent to admin email' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  signin(@Body() dto: AdminSigninDto, @Ip() ip: string) {
    return this.authService.signIn(dto.loginId, dto.password, ip);
  }

  @Post('admin/verify-login')
  @ApiOperation({ summary: 'Verify admin login OTP' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'Admin logged in successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  verifyAdminLogin(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyAdminLoginOtp(dto.email, dto.otp);
  }
  @Post('user/verify-registration')
  verifyRegistrationOtp(@Body() dto: VerifyOtpDto, @Ip() ip: string) {
    return this.authService.verifyRegistrationOtp(dto.email, dto.otp, ip);
  }

 @Post('tutor/verify-registration')
  verifyTutorRegistrationOtp(@Body() dto: VerifyOtpDto, @Ip() ip: string) {
    return this.authService.verifyTutorRegistrationOtp(dto.email, dto.otp, ip);
  }
    @Post('user/register')
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: UserRegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  userRegister(@Body() dto:UserRegisterDto, @Ip() ip: string) {
    dto.ip = ip;
    return this.authService.userRegister(dto);
  }

  @Post('user/resend-otp')
  @ApiOperation({ summary: 'Resend user registration OTP' })
  @ApiBody({ type: ResendUserOtpDto })
  @ApiResponse({ status: 200, description: 'User OTP resent successfully' })
  @ApiResponse({ status: 400, description: 'No pending user registration found' })
  resendUserOtp(@Body() dto: ResendUserOtpDto) {
    return this.authService.resendRegistrationOtp(dto.email);
  }

  @Post('tutor/resend-otp')
  @ApiOperation({ summary: 'Resend tutor registration OTP' })
  @ApiBody({ type: ResendTutorOtpDto })
  @ApiResponse({ status: 200, description: 'Tutor OTP resent successfully' })
  @ApiResponse({ status: 400, description: 'No pending tutor registration found' })
  resendTutorOtp(@Body() dto: ResendTutorOtpDto) {
    return this.authService.resendTutorRegistrationOtp(dto.email);
  }
  @Post('user/login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: UserLoginDto })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  userLogin(@Body() dto: UserLoginDto, @Ip() ip: string) {
    dto.ip = ip;
    return this.authService.userLogin(dto);
  }

  @Post('user/google-login')
  @ApiOperation({ summary: 'Google OAuth login for both user and tutor' })
  @ApiBody({ type: GoogleLoginDto })
  @ApiResponse({ status: 200, description: 'Google login successful' })
  @ApiResponse({ status: 400, description: 'Invalid Google token' })
  googleLogin(@Body() dto: GoogleLoginDto, @Ip() ip: string) {
    dto.ip = ip;
    return this.authService.googleLogin(dto);
  }

  @Post('tutor/google-login')
  @ApiOperation({summary:'Google Oauth login for  tutor'})
    @ApiBody({type: GoogleLoginDto})
    @ApiResponse({status:200, description:'Google login successful'})
    @ApiResponse({status:400, description:'Invalid google token'})
    tutorGooglelOgin(@Body()dto:GoogleLoginDto, @Ip()ip:string){
      dto.ip=ip;

    return this.authService.tutorGoogleLogin(dto, ip);

  }

    @Post('tutor/register')
  @ApiOperation({ summary: 'Tutor registration' })
  @ApiBody({ type: UserRegisterDto })
  @ApiResponse({ status: 201, description: 'Tutor registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Tutor already exists' })
  tutorRegister(@Body() dto: UserRegisterDto, @Ip() ip: string) {
    dto.ip = ip;
    return this.authService.tutorRegister(dto);
  }

  @Post('tutor/login')
  @ApiOperation({ summary: 'Tutor login' })
  @ApiBody({ type: UserLoginDto })
  @ApiResponse({ status: 200, description: 'Tutor logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  tutorLogin(@Body() dto: UserLoginDto, @Ip() ip: string) {
    dto.ip = ip;
    return this.authService.tutorLogin(dto);
  }


  @Post('forgotPass')
  @ApiOperation({ summary: 'Forgot password' })
  @ApiBody({ type: ForgotPassDto })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  userForgotPass(@Body() dto: ForgotPassDto) {
    return this.authService.forgotPass(dto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  

  @Post('resetPass')
  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({ type: ForgotPassDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  resetPassword(@Body() dto: ForgotPassDto) {
    return this.authService.resetPassword(dto);
  }
  


  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@CurrentUser() account: Account, @Ip() ip: string) {
    const accountId = account.id;
    return this.authService.logout(accountId, ip);
  }


}