import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BoookImagesService } from './boook-images.service';
import { CreateBoookImageDto } from './dto/create-boook-image.dto';
import { UpdateBoookImageDto } from './dto/update-boook-image.dto';

@Controller('boook-images')
export class BoookImagesController {
  constructor(private readonly boookImagesService: BoookImagesService) {}

  @Post()
  create(@Body() createBoookImageDto: CreateBoookImageDto) {
    return this.boookImagesService.create(createBoookImageDto);
  }

  @Get()
  findAll() {
    return this.boookImagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boookImagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoookImageDto: UpdateBoookImageDto) {
    return this.boookImagesService.update(+id, updateBoookImageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boookImagesService.remove(+id);
  }
}
