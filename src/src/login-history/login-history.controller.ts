import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { LoginHistoryService } from './login-history.service';
import { LoginHistoryFilterDto } from './dto/login-history.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/enum';

@Controller('login-history')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LoginHistoryController {
  constructor(private readonly loginHistoryService: LoginHistoryService) { }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(@Query() dto: LoginHistoryFilterDto) {
    return this.loginHistoryService.findAll(dto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findOne(@Param('id') id: string) {
    return this.loginHistoryService.findOne(id);
  }
}