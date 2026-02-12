import { Test, TestingModule } from '@nestjs/testing';
import { SavedBooksController } from './saved-books.controller';
import { SavedBooksService } from './saved-books.service';

describe('SavedBooksController', () => {
  let controller: SavedBooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavedBooksController],
      providers: [SavedBooksService],
    }).compile();

    controller = module.get<SavedBooksController>(SavedBooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
