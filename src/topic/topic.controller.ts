import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { TopicService } from './topic.service';
import {
  CreateTopicDto,
  UpdateTopicDto,
  TopicStatusDto,
  TopicPaginationDto,
} from './dto/create-topic.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { DefaultStatus, PermissionAction, UserRole } from 'src/enum';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('topic')
@ApiBearerAuth('JWT-auth')
@Controller('topic')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'topic'])
  @ApiOperation({ summary: 'Create new topic' })
  @ApiBody({ type: CreateTopicDto })
  @ApiResponse({ status: 201, description: 'Topic created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  create(@Body() dto: CreateTopicDto) {
    return this.topicService.create(dto);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'topic'])
  @ApiOperation({ summary: 'Get paginated topic list' })
  @ApiQuery({ name: 'limit', type: Number, required: true, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: true, example: 0 })
  @ApiQuery({ name: 'keyword', type: String, required: false })
  @ApiQuery({ name: 'status', enum: DefaultStatus, required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated topic list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  findAll(@Query() dto: TopicPaginationDto) {
    return this.topicService.findAll(dto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all topics for users' })
  @ApiResponse({ status: 200, description: 'Returns all active topics' })
  findByUser() {
    return this.topicService.findByUser();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'topic'])
  @ApiOperation({ summary: 'Get topic by ID' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Returns topic details' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.topicService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'topic'])
  @ApiOperation({ summary: 'Update topic details' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: UpdateTopicDto })
  @ApiResponse({ status: 200, description: 'Topic updated successfully' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id') id: string, @Body() dto: UpdateTopicDto) {
    return this.topicService.update(id, dto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'topic'])
  @ApiOperation({ summary: 'Update topic status' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: TopicStatusDto })
  @ApiResponse({ status: 200, description: 'Topic status updated successfully' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateStatus(@Param('id') id: string, @Body() dto: TopicStatusDto) {
    return this.topicService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'topic'])
  @ApiOperation({ summary: 'Delete topic' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Topic deleted successfully' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string) {
    return this.topicService.remove(id);
  }
}