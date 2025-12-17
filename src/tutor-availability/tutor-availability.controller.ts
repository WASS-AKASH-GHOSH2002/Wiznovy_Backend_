import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TutorAvailabilityService } from './tutor-availability.service';
import { CreateAvailabilityDto, AvailabilityPaginationDto, } from './dto/create-availability.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { UserRole } from 'src/enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('tutor-availability')
@UseGuards(JwtAuthGuard)
export class TutorAvailabilityController {
  constructor(private readonly availabilityService: TutorAvailabilityService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  create(@Body() dto: CreateAvailabilityDto, @CurrentUser() user: Account) {
    return this.availabilityService.create(dto, user.id);
  }

  @Post('block-slot')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  blockSlot(@Body() dto: any, @CurrentUser() user: Account) {
    return this.availabilityService.blockSlot(dto, user.id);
  }

  @Get('my-blocks')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  findMyBlocks(@CurrentUser() user: Account) {
    return this.availabilityService.findTutorBlocks(user.id);
  }

  @Get('my-availability')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  findMyAvailability(@Query() dto: AvailabilityPaginationDto, @CurrentUser() user: Account) {
    return this.availabilityService.findByTutor(user.id, dto);
  }

  @Get('available-slots/:tutorId/:date')
  @UseGuards(RolesGuard)
 @Roles(UserRole.USER)
  getAvailableSlots(
    @Param('tutorId') tutorId: string,
    @Param('date') date: string
  ) {
    return this.availabilityService.getAvailableBookingSlots(tutorId, date);
  }


  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  update(@Param('id') id: string, @Body() dto: Partial<CreateAvailabilityDto>, @CurrentUser() user: Account) {
    return this.availabilityService.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  remove(@Param('id') id: string, @CurrentUser() user: Account) {
    return this.availabilityService.remove(id, user.id);
  }
}