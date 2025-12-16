import {
  Body,
  Controller,
  Get,
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
import { UpdateUserDetailDto } from './dto/update-user-details.dto';
import { UserDetailsService } from './user-details.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('user-details')
@ApiBearerAuth('JWT-auth')
@Controller('user-details')
export class UserDetailsController {
  private static getStorageConfig() {
    return {
      storage: diskStorage({
        destination: './uploads/UserDetail/profile',
        filename: (req, file, callback) => {
          const randomName = randomBytes(16).toString('hex');
          return callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: FileSizeLimit.IMAGE_SIZE,
        files: 1,
        fields: 5
      },
    };
  }

  constructor(private readonly userDetailsService: UserDetailsService) {}

  @Patch('update')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Update user details' })
  @ApiBody({ type: UpdateUserDetailDto })
  @ApiResponse({ status: 200, description: 'User details updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Body() dto: UpdateUserDetailDto, @CurrentUser() user: Account) {
    dto.accountId = user.id;
    return this.userDetailsService.update(dto, user.id);
  }

  @Put('profileImage')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.USER)
  @UseInterceptors(FileInterceptor('file', UserDetailsController.getStorageConfig()))
  @ApiOperation({ summary: 'Update user profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile image file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file ',
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
        validators: [],
      }),
    )
    file: Express.Multer.File,
  ) {
    const fileData = await this.userDetailsService.findOne(user.id);
    return this.userDetailsService.profileImage(file.path, fileData);
  }

  @Get('overview')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Get user overview' })
  @ApiResponse({ status: 200, description: 'Returns user overview data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOverview(@CurrentUser() user: Account) {
    return this.userDetailsService.getOverview(user.id);
  }
}