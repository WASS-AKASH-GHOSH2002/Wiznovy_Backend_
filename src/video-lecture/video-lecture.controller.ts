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
import { FileUploadUtil } from 'src/utils/file-upload.util';



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
      [{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }],
      FileUploadUtil.createMultiFieldConfig('./uploads/VideoLecture/videos', './uploads/VideoLecture/thumbnails')
    )
  )
  create(
    @Body() dto: CreateVideoLectureDto,
    @UploadedFiles() files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
    @CurrentUser() user: Account,
  ) {
    return this.createVideoLecture(dto, files);
  }

  @Post('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.TUTOR)
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }],
      FileUploadUtil.createMultiFieldConfig('./uploads/VideoLecture/videos', './uploads/VideoLecture/thumbnails')
    )
  )
  admincreate(
    @Body() dto: CreateVideoLectureDto,
    @UploadedFiles() files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
    @CurrentUser() user: Account,
  ) {
    return this.createVideoLecture(dto, files);
  }

  private createVideoLecture(dto: CreateVideoLectureDto, files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] }) {
    const video = files.video?.[0];
    const thumbnail = files.thumbnail?.[0];
    return this.videoLectureService.create(dto, video, thumbnail);
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
    FileInterceptor('file', FileUploadUtil.createSingleFileConfig('./uploads/VideoLecture/videos', FileSizeLimit.VIDEO_SIZE))
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
    FileInterceptor('file', FileUploadUtil.createSingleFileConfig('./uploads/VideoLecture/thumbnails', FileSizeLimit.IMAGE_SIZE))
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
    FileInterceptor('file', FileUploadUtil.createSingleFileConfig('./uploads/VideoLecture/videos', FileSizeLimit.VIDEO_SIZE))
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
    FileInterceptor('file', FileUploadUtil.createSingleFileConfig('./uploads/VideoLecture/thumbnails', FileSizeLimit.IMAGE_SIZE))
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


}