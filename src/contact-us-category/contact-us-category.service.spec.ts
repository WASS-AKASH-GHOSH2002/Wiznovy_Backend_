import { Test, TestingModule } from '@nestjs/testing';
import { ContactUsCategoryService } from './contact-us-category.service';

describe('ContactUsCategoryService', () => {
  let service: ContactUsCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContactUsCategoryService],
    }).compile();

    service = module.get<ContactUsCategoryService>(ContactUsCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
