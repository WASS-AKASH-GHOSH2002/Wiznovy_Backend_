import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { StateService } from './state.service';
import { CreateStateDto, StatePaginationDto, StateStatusDto, UpdateStateDto } from './dto/create-state.dto';

@Controller('state')
export class StateController {
  constructor(private readonly stateService: StateService) {}

  @Post()
  create(@Body() createStateDto: CreateStateDto) {
    return this.stateService.create(createStateDto);
  }

  @Get()
  findAll(@Query() dto: StatePaginationDto) {
    return this.stateService.findAll(dto);
  }

  @Get('user')
  findByUser(@Query('countryId') countryId?: string) {
    return this.stateService.findByUser(countryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stateService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStateDto: UpdateStateDto) {
    return this.stateService.update(id, updateStateDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: StateStatusDto) {
    return this.stateService.updateStatus(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stateService.remove(id);
  }
}