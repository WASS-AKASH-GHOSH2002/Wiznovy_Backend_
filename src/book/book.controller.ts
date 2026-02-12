import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put, UploadedFile, UploadedFiles, UseInterceptors, ParseFilePipe, MaxFileSizeValidator, UsePipes, ValidationPipe } from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto, BookPaginationDto, UpdateStatusDto, BulkBookStatusDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { PermissionAction, UserRole, FileSizeLimit } from 'src/enum';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { FileUploadUtil } from 'src/utils/file-upload.util';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post('tutor')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createByTutor(@Body() createBookDto: CreateBookDto, @CurrentUser() user: Account) {
    return await this.bookService.createByTutor(createBookDto, user.id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'book'])
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() createBookDto: CreateBookDto) {
    return await this.bookService.create(createBookDto);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'book'])
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async savedBook(@Body() createBookDto: CreateBookDto) {
    return await this.bookService.create(createBookDto);
  }
  @Patch('tutor/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  updateByTutor(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto, @CurrentUser() user: Account) {
    return this.bookService.updateByTutor(id, updateBookDto, user.id);
  }

  @Put('tutor/status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  updateStatusByTutor(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser() user: Account) {
    return this.bookService.updateStatusByTutor(id, dto, user.id);
  }

  @Put('tutor/cover-image/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @UseInterceptors(FileInterceptor('file', FileUploadUtil.createUploadConfig('./uploads/Books', FileSizeLimit.IMAGE_SIZE)))
  async coverImageByTutor(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE })] })) file: Express.Multer.File,
  ) {
    return this.bookService.updateCoverImage(id, file.path);
  }

  @Put('tutor/pdf/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @UseInterceptors(FileInterceptor('file', FileUploadUtil.createUploadConfig('./uploads/Books/pdfs', FileSizeLimit.DOCUMENT_SIZE)))
  async pdfByTutor(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: FileSizeLimit.DOCUMENT_SIZE })] })) file: Express.Multer.File,
  ) {
    return this.bookService.updatePdfFile(id, file.path);
  }

  @Put('tutor/images/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @UseInterceptors(FilesInterceptor('files', 3, FileUploadUtil.createUploadConfig('./uploads/Books', FileSizeLimit.IMAGE_SIZE)))
  async replaceImagesByTutor(
    @Param('id') id: string,
    @UploadedFiles(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE })] })) files: Express.Multer.File[],
  ) {
    return this.bookService.replaceAllImages(id, files);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'book'])
  findAll(@Query() dto: BookPaginationDto) {
    return this.bookService.findAll(dto);
  }

  @Get('user/list')
  @UseGuards(AuthGuard('jwt'), RolesGuard,)
   @Roles(UserRole.USER)
  findByUser(@Query() dto: BookPaginationDto, @CurrentUser() user: Account) {
    return this.bookService.findByUser(dto, user.id);
  }

  @Get('user/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.USER)
  findOneForUser(@Param('id') id: string, @CurrentUser() user: Account) {
    return this.bookService.findOneByUser(id, user.id);
  }

  @Get('tutor/list')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  findByTutor(@Query() dto: BookPaginationDto, @CurrentUser() user: Account) {
    return this.bookService.findByTutor(dto, user.id);
  }

  
  @Get('tutor/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  findOneForTutor(@Param('id') id: string, @CurrentUser() user: Account) {
    return this.bookService.findOneByTutor(id, user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, )
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
  @UseInterceptors(FileInterceptor('file', FileUploadUtil.createUploadConfig('./uploads/Books', FileSizeLimit.IMAGE_SIZE)))
  async coverImage(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE })] })) file: Express.Multer.File,
  ) {
    return this.bookService.updateCoverImage(id, file.path);
  }

  @Put('pdf/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'book'])
  @UseInterceptors(FileInterceptor('file', FileUploadUtil.createUploadConfig('./uploads/Books/pdfs', FileSizeLimit.DOCUMENT_SIZE)))
  async pdfFile(
    @Param('id') id: string,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: FileSizeLimit.DOCUMENT_SIZE })] })) file: Express.Multer.File,
  ) {
    return this.bookService.updatePdfFile(id, file.path);
  }

  @Post('add/images/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'book'])
  @UseInterceptors(FilesInterceptor('files', 10, FileUploadUtil.createUploadConfig('./uploads/Books', FileSizeLimit.IMAGE_SIZE)))
  async addImages(
    @Param('id') id: string,
    @UploadedFiles(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE })] })) files: Express.Multer.File[],
  ) {
    return this.bookService.addImages(id, files);
  }

  @Put('images/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'book'])
  @UseInterceptors(FilesInterceptor('files', 3, FileUploadUtil.createUploadConfig('./uploads/Books', FileSizeLimit.IMAGE_SIZE)))
  async replaceImages(
    @Param('id') id: string,
    @UploadedFiles(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE })] })) files: Express.Multer.File[],
  ) {
    return this.bookService.replaceAllImages(id, files);
  }

  @Put('bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'book'])
  bulkUpdateStatus(@Body() dto: BulkBookStatusDto) {
    return this.bookService.bulkUpdateStatus(dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'book'])
  remove(@Param('id') id: string) {
    return this.bookService.remove(id);
  }

  
}
