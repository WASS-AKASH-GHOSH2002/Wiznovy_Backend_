import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/enum';
import { Account } from 'src/account/entities/account.entity';
import { BankDetailsService } from './bank-details.service';
import { CreateBankDetailDto, UpdateBankDetailDto } from './dto/bank-detail.dto';

@ApiTags('bank-details')
@ApiBearerAuth('JWT-auth')
@Controller('bank-details')
export class BankDetailsController {
  constructor(private readonly bankDetailsService: BankDetailsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Create bank details' })
  @ApiBody({ type: CreateBankDetailDto })
  @ApiResponse({ status: 201, description: 'Bank details created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or bank details already exist' })
  create(@Body() dto: CreateBankDetailDto, @CurrentUser() user: Account) {
    return this.bankDetailsService.create(user.id, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Get tutor bank details' })
  @ApiResponse({ status: 200, description: 'Returns tutor bank details' })
  @ApiResponse({ status: 404, description: 'Bank details not found' })
  findOne(@CurrentUser() user: Account) {
    return this.bankDetailsService.findByTutorId(user.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Update bank details' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateBankDetailDto })
  @ApiResponse({ status: 200, description: 'Bank details updated successfully' })
  @ApiResponse({ status: 404, description: 'Bank details not found' })
  update(@Param('id') id: string, @Body() dto: UpdateBankDetailDto, @CurrentUser() user: Account) {
    return this.bankDetailsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Delete bank details' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Bank details deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bank details not found' })
  remove(@Param('id') id: string, @CurrentUser() user: Account) {
    return this.bankDetailsService.remove(id, user.id);
  }
}
