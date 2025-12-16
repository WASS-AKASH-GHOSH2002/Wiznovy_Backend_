import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put, UploadedFile, UploadedFiles, UseInterceptors, ParseFilePipe, MaxFileSizeValidator } from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto, BookPaginationDto, UpdateStatusDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { PermissionAction, UserRole, FileSizeLimit } from 'src/enum';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('books')
export class BookController {
  private static getStorageConfig() {
    return {
      storage: diskStorage({
        destination: './uploads/Books',
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
        files: 10,
        fields: 5
      },
    };
  }

  constructor(private readonly bookService: BookService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'book'])
  create(@Body() createBookDto: CreateBookDto) {
    return this.bookService.create(createBookDto);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'book'])
  findAll(@Query() dto: BookPaginationDto) {
    return this.bookService.findAll(dto);
  }

  @Get('user/list')
  findByUser(@Query() dto: BookPaginationDto) {
    return this.bookService.findByUser(dto);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'book'])
  findOne(@Param('id') id: string) {
    return this.bookService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'book'])
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.bookService.update(id, updateBookDto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'book'])
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.bookService.updateStatus(id, dto);
  }

  @Put('cover-image/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'book'])
  @UseInterceptors(FileInterceptor('file', BookController.getStorageConfig()))
  async coverImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE }),
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    return this.bookService.updateCoverImage(id, file.path);
  }

  @Post('images/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'book'])
  @UseInterceptors(FilesInterceptor('files', 10, BookController.getStorageConfig()))
  async addImages(
    @Param('id') id: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE }),
        ],
      }),
    ) files: Express.Multer.File[],
  ) {
    return this.bookService.addImages(id, files);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'book'])
  remove(@Param('id') id: string) {
    return this.bookService.remove(id);
  }
}
