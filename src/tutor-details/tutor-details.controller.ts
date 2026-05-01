import {
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  HttpStatus,
  Param,
  ParseFilePipe,
  Patch,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MESSAGE_CODES } from 'src/shared/constants/message-codes';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Account } from 'src/account/entities/account.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole, FileSizeLimit } from 'src/enum';
import { UpdateTutorDetailDto } from './dto/update-tutor-details.dto';
import { TutorStep1Dto, TutorStep2Dto, TutorStep3Dto, TutorStep4Dto, TutorStep5Dto, TutorStep6Dto, TutorStep7Dto, TutorStep9Dto, TutorStep10Dto } from './dto/tutor-steps.dto';
import { TutorDetailsService } from './tutor-details.service';
import { courseImageFileFilter, documentFileFilter } from '../utils/fileUpload.utils';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('tutor-details')
@ApiBearerAuth('JWT-auth')
@Controller('tutor-details')
export class TutorDetailsController {
  constructor(private readonly tutorDetailsService: TutorDetailsService) {}

  @Patch('location')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Update tutor location (lat, lng, timezone)' })
  updateLocation(@Body() dto: { lat: number; lng: number; timezone: string }, @CurrentUser() user: Account) {
    return this.tutorDetailsService.updateLocation(user.id, dto);
  }

  @Patch('update')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Update tutor details' })
  @ApiBody({ type: UpdateTutorDetailDto })
  update(@Body() dto: UpdateTutorDetailDto, @CurrentUser() user: Account) {
    dto.accountId = user.id;
    return this.tutorDetailsService.update(dto, user.id);
  }

  @Patch('step1')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Step 1 - Personal Info (name, dob, gender)' })
  @ApiBody({ type: TutorStep1Dto })
  updateStep1(@Body() dto: TutorStep1Dto, @CurrentUser() user: Account) {
    return this.tutorDetailsService.updateStep1(dto, user.id);
  }

  @Patch('step2')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Step 2 - Subject & Expertise (subjectIds, expertiseLevel)' })
  @ApiBody({ type: TutorStep2Dto })
  updateStep2(@Body() dto: TutorStep2Dto, @CurrentUser() user: Account) {
    return this.tutorDetailsService.updateStep2(dto, user.id);
  }

  @Patch('step3')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Step 3 - Location & Language (countryId, stateId, cityId, languageId)' })
  @ApiBody({ type: TutorStep3Dto })
  updateStep3(@Body() dto: TutorStep3Dto, @CurrentUser() user: Account) {
    return this.tutorDetailsService.updateStep3(dto, user.id);
  }

  @Patch('step4')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Step 4 - Budget' })
  @ApiBody({ type: TutorStep4Dto })
  updateStep4(@Body() dto: TutorStep4Dto, @CurrentUser() user: Account) {
    return this.tutorDetailsService.updateStep4(dto, user.id);
  }

  @Patch('step5')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Step 5 - Qualification & Certification (qualificationId)' })
  @ApiBody({ type: TutorStep5Dto })
  updateStep5(@Body() dto: TutorStep5Dto, @CurrentUser() user: Account) {
    return this.tutorDetailsService.updateStep5(dto, user.id);
  }

  @Put('step5/certification')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @UseInterceptors(FileInterceptor('file', TutorDetailsController.getUploadConfig('certifications', documentFileFilter)))
  @ApiOperation({ summary: 'Step 5 - Upload Qualification Certification (JPG, PNG, PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async uploadCertification(
    @CurrentUser() user: Account,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: FileSizeLimit.DOCUMENT_SIZE })] }))
    file: Express.Multer.File,
  ) {
    const fileData = await this.tutorDetailsService.findOne(user.id);
    return this.tutorDetailsService.qualificationCertification(file.path, fileData);
  }

  @Patch('step6')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Step 6 - Teaching Experience' })
  @ApiBody({ type: TutorStep6Dto })
  updateStep6(@Body() dto: TutorStep6Dto, @CurrentUser() user: Account) {
    return this.tutorDetailsService.updateStep6(dto, user.id);
  }

  @Patch('step7')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Step 7 - Language & Proficiency' })
  @ApiBody({ type: TutorStep7Dto })
  updateStep7(@Body() dto: TutorStep7Dto, @CurrentUser() user: Account) {
    return this.tutorDetailsService.updateStep7(dto, user.id);
  }

  @Patch('step9')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Step 9 - Bio' })
  @ApiBody({ type: TutorStep9Dto })
  updateStep9(@Body() dto: TutorStep9Dto, @CurrentUser() user: Account) {
    return this.tutorDetailsService.updateStep9(dto, user.id);
  }

  @Patch('step10')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Step 10 - Hourly Rate & Trial Rate' })
  @ApiBody({ type: TutorStep10Dto })
  updateStep10(@Body() dto: TutorStep10Dto, @CurrentUser() user: Account) {
    return this.tutorDetailsService.updateStep10(dto, user.id);
  }

  @Put('profileImage')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UseInterceptors(FileInterceptor('file', TutorDetailsController.getProfileImageConfig()))
  @ApiOperation({ summary: 'Update tutor profile image (JPG, PNG)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async profileImage(
    @CurrentUser() user: Account,
    @UploadedFile(new ParseFilePipe({
      validators: [new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE, message: `${MESSAGE_CODES.VALIDATION_FILE_TOO_LARGE.title}: ${MESSAGE_CODES.VALIDATION_FILE_TOO_LARGE.message}` })],
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }))
    file: Express.Multer.File,
  ) {
    const fileData = await this.tutorDetailsService.findOne(user.id);
    return this.tutorDetailsService.profileImage(file.path, fileData);
  }

  @Put('step8/document')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @UseInterceptors(FileInterceptor('file', TutorDetailsController.getUploadConfig('documents', documentFileFilter)))
  @ApiOperation({ summary: 'Step 8 - Upload Document (JPG, PNG, PDF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async document(
    @CurrentUser() user: Account,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: FileSizeLimit.DOCUMENT_SIZE })] }))
    file: Express.Multer.File,
  ) {
    const fileData = await this.tutorDetailsService.findOne(user.id);
    return this.tutorDetailsService.document(file.path, fileData);
  }

  @Put('step11/introduction-video')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @UseInterceptors(FileInterceptor('file', TutorDetailsController.getUploadConfig('videos')))
  @ApiOperation({ summary: 'Step 11 - Upload Introduction Video' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async introductionVideo(
    @CurrentUser() user: Account,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: FileSizeLimit.VIDEO_SIZE })] }))
    file: Express.Multer.File,
  ) {
    const fileData = await this.tutorDetailsService.findOne(user.id);
    return this.tutorDetailsService.introductionVideo(file.path, fileData);
  }


  
  @Get('current-step')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Get current incomplete step for tutor onboarding' })
  @ApiResponse({ status: 200, description: 'Returns the current step number to resume from' })
  async getCurrentStep(@CurrentUser() user: Account) {
    return this.tutorDetailsService.getCurrentStep(user.id);
  }

  @Get('overview')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Get tutor overview' })
  @ApiResponse({ status: 200, description: 'Returns tutor overview data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOverview(@CurrentUser() user: Account) {
    return this.tutorDetailsService.getOverview(user.id);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all active tutors with ratings' })
  @ApiResponse({ status: 200, description: 'Returns list of active tutors with their ratings' })
  async getAllTutors() {
    return this.tutorDetailsService.findAllTutors();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tutor details by ID' })
  @ApiResponse({ status: 200, description: 'Returns tutor details' })
  @ApiResponse({ status: 404, description: 'Tutor not found' })
  async findById(@Param('id') id: string) {
    return this.tutorDetailsService.findById(id);
  }

  private static getUploadConfig(folder: string, fileFilter?: any, maxSize: number = FileSizeLimit.DOCUMENT_SIZE) {
    return {
      storage: diskStorage({
        destination: `./uploads/TutorDetail/${folder}`,
        filename: (req, file, cb) => cb(null, `${randomBytes(16).toString('hex')}${extname(file.originalname)}`),
      }),
      ...(fileFilter && { fileFilter }),
      limits: { fileSize: maxSize, files: 1 },
    };
  }

  private static getProfileImageConfig() {
    return TutorDetailsController.getUploadConfig('profile', courseImageFileFilter, FileSizeLimit.IMAGE_SIZE);
  }
}