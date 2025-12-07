import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CommonPaginationDto } from 'src/common/dto/common-pagination.dto';
import { PermissionAction, UserRole } from 'src/enum';
import { SearchHistoryService } from './search-history.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';

@Controller('search-history')
export class SearchHistoryController {
  constructor(private readonly searchHistoryService: SearchHistoryService) {}

  @Get('user/search')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
 // @Roles(UserRole.USER)
  findAllByUser(
    @CurrentUser() user: Account,
    @Query() dto: CommonPaginationDto,
  ) {
    return this.searchHistoryService.findAllByUser(dto, user.id);
  }
}
