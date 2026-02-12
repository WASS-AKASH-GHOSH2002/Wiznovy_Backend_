import { Test, TestingModule } from '@nestjs/testing';
import { SavedBooksService } from './saved-books.service';

describe('SavedBooksService', () => {
  let service: SavedBooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SavedBooksService],
    }).compile();

    service = module.get<SavedBooksService>(SavedBooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
