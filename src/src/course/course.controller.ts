import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, ParseFilePipe, Patch, UsePipes, ValidationPipe, MaxFileSizeValidator, } from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto, UpdateCourseDto, CoursePaginationDto } from './dto/create-course.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Account } from '../account/entities/account.entity';
import { PermissionAction, UserRole, FileSizeLimit } from '../enum';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { CourseStatusDto } from './dto/course-status.dto';
import { DeleteCourseDto } from './dto/delete-course.dto';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { courseImageFileFilter } from '../utils/fileUpload.utils';

@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.TUTOR)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 }
    ], {
      storage: diskStorage({
        destination: './uploads/Course/thumbnails',
        filename: (req, file, callback) => {
          const randomName = new Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: courseImageFileFilter,
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
      },
    })
  )
  create(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: Account,
    @UploadedFiles() files?: { image?: Express.Multer.File[], thumbnail?: Express.Multer.File[] }
  ) {
    return this.courseService.create(createCourseDto, user.id, files);
  }

   @Post('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.TUTOR)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 }
    ], {
      storage: diskStorage({
        destination: './uploads/Course/thumbnails',
        filename: (req, file, callback) => {
          const randomName = new Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: courseImageFileFilter,
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
      },
    })
  )
  admincreate(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: Account,
    @UploadedFiles() files?: { image?: Express.Multer.File[], thumbnail?: Express.Multer.File[] }
  ) {
    return this.courseService.create(createCourseDto, user.id, files);
  }


  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'course'])
  findAll(@Query() dto: CoursePaginationDto) {
    return this.courseService.findAll(dto);
  }

  @Get('my-courses')
  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.TUTOR, UserRole.ADMIN, UserRole.STAFF)
  getMyCourses(@Query() dto: CoursePaginationDto, @CurrentUser() user: Account) {
    return this.courseService.getMyCourses(dto, user.id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findByUser(@Query() dto: CoursePaginationDto, @CurrentUser() user: Account) {
    return this.courseService.findByUser(dto, user.id);
  }

 
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.TUTOR)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 }
    ], {
      storage: diskStorage({
        destination: './uploads/Course/thumbnails',
        filename: (req, file, callback) => {
          const randomName = new Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: courseImageFileFilter,
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
      },
    })
  )
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: Account,
    @UploadedFiles() files?: { image?: Express.Multer.File[], thumbnail?: Express.Multer.File[] }
  ) {
    return this.courseService.update(id, updateCourseDto, user.id, files);
  }

  @Patch('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.TUTOR)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 }
    ], {
      storage: diskStorage({
        destination: './uploads/Course/thumbnails',
        filename: (req, file, callback) => {
          const randomName = new Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: courseImageFileFilter,
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
      },
    })
  )
  adminUpdate(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: Account,
    @UploadedFiles() files?: { image?: Express.Multer.File[], thumbnail?: Express.Multer.File[] }
  ) {
    return this.courseService.update(id, updateCourseDto, user.id, files);
  }


  @Patch('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF,UserRole.TUTOR)
  @CheckPermissions([PermissionAction.UPDATE, 'course'])
  updateStatus(
    @Param('id') id: string,
    @Body() dto: CourseStatusDto
  ) {
    return this.courseService.updateStatus(id, dto);
  }

  @Put('image/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'course'])
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/Course/images',
        filename: (req, file, callback) => {
          const randomName = new Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: courseImageFileFilter,
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
      },
    }),
  )
  async image(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE })
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const course = await this.courseService.findOne(id);
    return this.courseService.image(file.path, course);
  }

  @Put('thumbnail/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'course'])
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/Course/thumbnails',
        filename: (req, file, callback) => {
          const randomName = new Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: courseImageFileFilter,
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
      },
    }),
  )
  async thumbnail(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE })
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const course = await this.courseService.findOne(id);
    return this.courseService.thumbnail(file.path, course);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'course'])
  remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'course'])
  deleteCourse(
    @Param('id') id: string,
    @Body() dto: DeleteCourseDto
  ) {
    return this.courseService.deleteCourse(id, dto.reason);
  }


@Get(':id/full')
@UseGuards(AuthGuard('jwt'))
@Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.USER)
getFullCourse(@Param('id') id: string) {
  return this.courseService.getFullCourseById(id);
}
}