import {
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  FileTypeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
import { TutorDetailsService } from './tutor-details.service';
import { courseImageFileFilter } from '../utils/fileUpload.utils';
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

  @Patch('update')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Update tutor details' })
  @ApiBody({ type: UpdateTutorDetailDto })
  @ApiResponse({ status: 200, description: 'Tutor details updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Body() dto: UpdateTutorDetailDto, @CurrentUser() user: Account) {
    dto.accountId = user.id;
    return this.tutorDetailsService.update(dto, user.id);
  }

  @Put('profileImage')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UseInterceptors(
    FileInterceptor('file', TutorDetailsController.getProfileImageConfig())
  )
  @ApiOperation({ summary: 'Update tutor profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile image file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (max 10MB)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profile image updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async profileImage(
    @CurrentUser() user: Account,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FileSizeLimit.IMAGE_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const fileData = await this.tutorDetailsService.findOne(user.id);
    return this.tutorDetailsService.profileImage(file.path, fileData);
  }

  @Put('document')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(
  FileInterceptor('file', TutorDetailsController.getDocumentConfig())
)
@ApiOperation({ summary: 'Upload tutor document' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  description: 'Document file',
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: 'Document file (max 10MB)',
      },
    },
  },
})
@ApiResponse({ status: 200, description: 'Document uploaded successfully' })
@ApiResponse({ status: 400, description: 'Invalid file or file too large' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async document(
  @CurrentUser() user: Account,
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: FileSizeLimit.DOCUMENT_SIZE }),
      ],
    }),
  )
  file: Express.Multer.File,
) {
  const fileData = await this.tutorDetailsService.findOne(user.id);
  return this.tutorDetailsService.document(file.path, fileData);
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

  private static getProfileImageConfig() {
    return {
      storage: diskStorage({
        destination: './uploads/TutorDetail/profile',
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: courseImageFileFilter,
      limits: { 
        fileSize: FileSizeLimit.IMAGE_SIZE,
        files: 1,
        fields: 5
      },
    };
  }

  private static getDocumentConfig() {
    return {
      storage: diskStorage({
        destination: './uploads/TutorDetail/documents',
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { 
        fileSize: FileSizeLimit.DOCUMENT_SIZE,
        files: 1,
        fields: 5
      },
    };
  }
}