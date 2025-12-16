import { Body, Controller, Get, Param, ParseIntPipe, Post, Delete, UploadedFile, UseGuards, UseInterceptors, Put, ParseFilePipe, MaxFileSizeValidator, Query, Patch } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import {  UpdatePageDto, PagePaginationDto } from './dto/page.dto';
import { CreatePageDto } from './dto/create-page.dto';
import { PagesService } from './pages.service';
import { UserRole, FileSizeLimit } from 'src/enum';

@ApiTags('Pages')
@ApiBearerAuth('JWT-auth')
@Controller('pages')
export class PagesController {
  private static getStorageConfig() {
    return {
      storage: diskStorage({
        destination: './uploads/Pages',
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
      },
    };
  }

  constructor(private readonly pagesService: PagesService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @UseInterceptors(FileInterceptor('file', PagesController.getStorageConfig()))
  @ApiOperation({ summary: 'Create new page' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Page image file and data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        title: { type: 'string' },
        pageType: { type: 'string', enum: [ 'USER', 'TUTOR' ] },
        desc: { type: 'string' },
      },
      required: ['file', 'title', 'pageType', 'desc'],
    },
  })
  @ApiResponse({ status: 201, description: 'Page created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreatePageDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.pagesService.create(file.path, dto);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get paginated page list' })
  @ApiQuery({ name: 'limit', type: Number, required: true, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: true, example: 0 })
  @ApiQuery({ name: 'keyword', type: String, required: false })

  @ApiQuery({ name: 'pageType', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated page list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() dto: PagePaginationDto) {
    return this.pagesService.findAll(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pages' })
  findAllPublic() {
    return this.pagesService.findAllPublic();
  }

  @Get('type/:pageType')
  @ApiOperation({ summary: 'Get pages by page type' })
  @ApiResponse({ status: 200, description: 'Returns pages filtered by type' })
  findByType(@Param('pageType') pageType: string) {
    return this.pagesService.findByType(pageType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get page by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pagesService.findOne(id);
  }

  @Put('update/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @UseInterceptors(FileInterceptor('file', PagesController.getStorageConfig()))
  @ApiOperation({ summary: 'Update page image' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    description: 'New page image file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Page image updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async image(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const fileData = await this.pagesService.findOne(id);
    return this.pagesService.image(file.path, fileData);
  }

  @Patch('update-details/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update page details' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdatePageDto })
  @ApiResponse({ status: 200, description: 'Page details updated successfully' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateDetails(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePageDto) {
    return this.pagesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Delete page' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pagesService.remove(id);
  }
}