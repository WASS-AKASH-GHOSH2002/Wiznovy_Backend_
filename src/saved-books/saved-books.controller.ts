import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SavedBooksService } from './saved-books.service';
import { CreateSavedBookDto, SavedBookPaginationDto } from './dto/create-saved-book.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Account } from '../account/entities/account.entity';

@ApiTags('saved-books')
@Controller('saved-books')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class SavedBooksController {
  constructor(private readonly savedBooksService: SavedBooksService) {}

  @Post()
  @ApiOperation({ summary: 'Save a book' })
  @ApiResponse({ status: 201, description: 'Book saved successfully' })
  @ApiResponse({ status: 409, description: 'Book already saved' })
  create(@Body() dto: CreateSavedBookDto, @CurrentUser() user: Account) {
    return this.savedBooksService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get saved books' })
  @ApiResponse({ status: 200, description: 'Saved books retrieved successfully' })
  findAll(@Query() dto:SavedBookPaginationDto, @CurrentUser() user: Account) {
    return this.savedBooksService.findAll(user.id, dto);
  }

  @Delete(':bookId')
  @ApiOperation({ summary: 'Remove saved book' })
  @ApiResponse({ status: 200, description: 'Book removed from saved list' })
  @ApiResponse({ status: 404, description: 'Saved book not found' })
  remove(@Param('bookId') bookId: string, @CurrentUser() user: Account) {
    return this.savedBooksService.remove(bookId, user.id);
  }
}