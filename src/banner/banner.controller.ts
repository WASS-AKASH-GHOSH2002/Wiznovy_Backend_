import { Controller, Get, Post, Body, Patch, Param, FileTypeValidator, MaxFileSizeValidator, ParseFilePipe, UploadedFile, UseGuards, UseInterceptors, Query, Put } from '@nestjs/common';
import { BannerService } from './banner.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { DefaultStatus, PermissionAction, UserRole, FileSizeLimit } from 'src/enum';
import { BannerDto, BannerFilterDto, BannerPaginationDto } from './dto/create-banner.dto';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('banner')
@ApiBearerAuth('JWT-auth')
@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'banner'])
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/Banners',
        filename: (req, file, callback) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
      },
    }),
  )
  @ApiOperation({ summary: 'Create new banner' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Banner image file and data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        bannerType: {
          type: 'string',
          enum: [ 'USER_APP_BANNER', 'WEBSITE_BANNER'],
          example: 'WEBSITE_BANNER',
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'DEACTIVE', 'DELETED', 'SUSPENDED', 'PENDING'],
          example: 'ACTIVE',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Banner created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() dto: BannerDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // new FileTypeValidator({ fileType: 'image/(jpeg|jpg|png)' }),
           new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {   
    return this.bannerService.create(file.path, dto);
  }
  
  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'banner'])
  @ApiOperation({ summary: 'Get paginated banner list' })
  @ApiQuery({ name: 'limit', type: Number, required: true, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: true, example: 0 })
  @ApiQuery({ name: 'keyword', type: String, required: false })
  @ApiQuery({ name: 'status', enum: DefaultStatus, required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated banner list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  findAll(@Query() dto: BannerPaginationDto) {
    return this.bannerService.findAll(dto);
  }
  
   @Get('user')
  async findByUser(@Query() dto: BannerFilterDto) {
    return this.bannerService.findByUser(dto);
  }

  @Put('update/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'banner'])
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/Banners',
        filename: (req, file, callback) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
      },
    }),
  )
  @ApiOperation({ summary: 'Update banner image' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({
    description: 'New banner image file',
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
  @ApiResponse({ status: 200, description: 'Banner image updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async image(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
         //new FileTypeValidator({ fileType: 'image/(jpeg|jpg|png)' }),
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {   
    const fileData = await this.bannerService.findOne(id);    
    return this.bannerService.image(file.path, fileData);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'banner'])
  @ApiOperation({ summary: 'Update banner status' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: BannerDto })
  @ApiResponse({ status: 200, description: 'Banner status updated successfully' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  status(@Param('id') id: string, @Body() dto: BannerDto) {
    return this.bannerService.status(id, dto);
  }
}