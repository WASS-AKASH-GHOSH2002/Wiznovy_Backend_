import { Controller, Get, Post, Body, Param,MaxFileSizeValidator, ParseFilePipe, UploadedFile, UseGuards, UseInterceptors, Query, Put } from '@nestjs/common';
import { BannerService } from './banner.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomBytes } from 'node:crypto';
import { extname } from 'node:path';
import { imageFileFilter } from '../utils/fileUpload.utils';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { DefaultStatus, PermissionAction, UserRole, FileSizeLimit } from 'src/enum';
import { BannerDto, BannerFilterDto, BannerPaginationDto, } from './dto/create-banner.dto';
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
  private static getStorageConfig() {
    return {
      storage: diskStorage({
        destination: './uploads/Banners',
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
        files: 1,
        fields: 5
      },
    };
  }

  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'banner'])
  @UseInterceptors(FileInterceptor('file', BannerController.getStorageConfig()))
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

  @Put('image/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'banner'])
  @UseInterceptors(FileInterceptor('file', BannerController.getStorageConfig()))
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
          new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE }),
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

  @Put('type/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'banner'])
  @ApiOperation({ summary: 'Update banner type' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: BannerDto })
  @ApiResponse({ status: 200, description: 'Banner type updated successfully' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  type(@Param('id') id: string, @Body() dto: BannerDto) {
    return this.bannerService.type(id, dto);
  }



}