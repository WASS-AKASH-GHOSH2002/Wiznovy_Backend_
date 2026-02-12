import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CityService } from './city.service';
import { CreateCityDto, UpdateCityDto, CityPaginationDto, CityStatusDto, BulkCityStatusDto } from './dto/create-city.dto';

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Post()
  create(@Body() createCityDto: CreateCityDto) {
    return this.cityService.create(createCityDto);
  }



  @Get('list')
  findAll(@Query() dto: CityPaginationDto) {
    return this.cityService.findAll(dto);
  }

  @Get('user')
  findByUser(@Query('stateId') stateId?: string) {
    return this.cityService.findByUser(stateId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cityService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.cityService.update(+id, updateCityDto);
  }

  @Put('status/:id')
  updateStatus(@Param('id') id: string, @Body() dto: CityStatusDto) {
    return this.cityService.updateStatus(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cityService.remove(+id);
  }

  @Put('bulk-status')
  bulkUpdateStatus(@Body() dto: BulkCityStatusDto) {
    return this.cityService.bulkUpdateStatus(dto);
  }
}
