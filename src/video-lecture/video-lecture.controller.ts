import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, UseInterceptors, UploadedFile, ParseFilePipe, UploadedFiles } from '@nestjs/common';
import { VideoLectureService } from './video-lecture.service';
import { CreateVideoLectureDto, Filter, UpdateVideoLectureDto, VideoLecturePaginationDto } from './dto/create-video-lecture.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionAction, UserRole, FileSizeLimit } from 'src/enum';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomBytes } from 'node:crypto';



@Controller('video-lecture')
export class VideoLectureController {
  constructor(
    private readonly videoLectureService: VideoLectureService,
  ) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }, { name: 'studyMaterial', maxCount: 1 }],
      VideoLectureController.createVideoLectureUploadConfig()
    )
  )
  create(
    @Body() dto: CreateVideoLectureDto,
    @UploadedFiles() files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[]; studyMaterial?: Express.Multer.File[] },
    @CurrentUser() user: Account,
  ) {
    return this.createVideoLecture(dto, files);
  }

  @Post('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.TUTOR)
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }, { name: 'studyMaterial', maxCount: 1 }],
      VideoLectureController.createVideoLectureUploadConfig()
    )
  )
  admincreate(
    @Body() dto: CreateVideoLectureDto,
    @UploadedFiles() files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[]; studyMaterial?: Express.Multer.File[] },
    @CurrentUser() user: Account,
  ) {
    return this.createVideoLecture(dto, files);
  }

  private createVideoLecture(dto: CreateVideoLectureDto, files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[]; studyMaterial?: Express.Multer.File[] }) {
    const video = files.video?.[0];
    const thumbnail = files.thumbnail?.[0];
    const studyMaterial = files.studyMaterial?.[0];
    return this.videoLectureService.create(dto, video, thumbnail, studyMaterial);
  }


  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF,UserRole.TUTOR)
  @CheckPermissions([PermissionAction.READ, 'video_lecture'])
  findAll(@Query() dto: VideoLecturePaginationDto) {
    return this.videoLectureService.findAll(dto);
  }

  @Get('user')
    @UseGuards(AuthGuard('jwt'), RolesGuard, )
    @Roles(UserRole.USER)
  findByUser(@Query() dto: Filter) {
    return this.videoLectureService.findByUser(dto);
  }


  @Get('tutor/unit/:unitId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  getTutorVideosByUnit(@Param('unitId') unitId: string, @CurrentUser() user: Account) {
    return this.videoLectureService.getTutorVideosByUnit(unitId, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.videoLectureService.findOne(id);
  }



  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  update(@Param('id') id: string, @Body() dto: UpdateVideoLectureDto) {
    return this.videoLectureService.update(id, dto);
  }

  @Put('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'video_lecture'])
  adminupdate(@Param('id') id: string, @Body() dto: UpdateVideoLectureDto) {
    return this.videoLectureService.update(id, dto);
  }


  @Put('video/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @UseInterceptors(
    FileInterceptor('file', VideoLectureController.createSingleFileConfig('./uploads/VideoLecture/videos', FileSizeLimit.VIDEO_SIZE))
  )
  async uploadVideo(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipe({ validators: [] })) file: Express.Multer.File,
  ) {
    return this.handleVideoUpload(id, file);
  }

  @Put('thumbnail/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @UseInterceptors(
    FileInterceptor('file', VideoLectureController.createSingleFileConfig('./uploads/VideoLecture/thumbnails', FileSizeLimit.IMAGE_SIZE))
  )
  async thumbnail(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipe({ validators: [] })) file: Express.Multer.File,
  ) {
    return this.handleThumbnailUpload(id, file);
  }


  @Put('admin/video/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'video_lecture'])
  @UseInterceptors(
    FileInterceptor('file', VideoLectureController.createSingleFileConfig('./uploads/VideoLecture/videos', FileSizeLimit.VIDEO_SIZE))
  )
  async adminuploadVideo(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipe({ validators: [] })) file: Express.Multer.File,
  ) {
    return this.handleVideoUpload(id, file);
  }

  @Put('admin/thumbnail/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'video_lecture'])
  @UseInterceptors(
    FileInterceptor('file', VideoLectureController.createSingleFileConfig('./uploads/VideoLecture/thumbnails', FileSizeLimit.IMAGE_SIZE))
  )
  async adminthumbnail(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipe({ validators: [] })) file: Express.Multer.File,
  ) {
    return this.handleThumbnailUpload(id, file);
  }

  private async handleVideoUpload(id: string, file: Express.Multer.File) {
    const videoData = await this.videoLectureService.findOne(id);
    return this.videoLectureService.uploadVideo(file.path, videoData);
  }

  private async handleThumbnailUpload(id: string, file: Express.Multer.File) {
    const fileData = await this.videoLectureService.findOne(id);
    return this.videoLectureService.thumbnail(file.path, fileData);
  }

  private static createVideoLectureUploadConfig() {
    return {
      storage: diskStorage({
        destination: (req, file, callback) => {
          let dest;
          if (file.fieldname === 'video') dest = './uploads/VideoLecture/videos';
          else if (file.fieldname === 'thumbnail') dest = './uploads/VideoLecture/thumbnails';
          else if (file.fieldname === 'studyMaterial') dest = './uploads/StudyMaterial/pdfs';
          callback(null, dest);
        },
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.VIDEO_SIZE,
        files: 3,
        fields: 10,
        fieldNameSize: 100,
        fieldSize: 1048576,
        parts: 15
      },
    };
  }

  private static createSingleFileConfig(destination: string, fileSize: number) {
    return {
      storage: diskStorage({
        destination,
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { 
        fileSize,
        files: 1,
        fields: 5,
        fieldNameSize: 100,
        fieldSize: 1048576,
        parts: 7
      },
    };
  }

}