import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryPginationDto, CreateCategoryDto,  UpdateCategoryStatusDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll(
    @Query() dto: CategoryPginationDto
  ) {
    return this.categoriesService.findAll(dto);
  }
  @Get('all')
  findAllCategory() {
    return this.categoriesService.findByUser();
 
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Put('status/:id')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCategoryStatusDto){
    return this.categoriesService.updateStatus(id,dto)
  } 

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
