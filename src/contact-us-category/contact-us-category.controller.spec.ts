import { Test, TestingModule } from '@nestjs/testing';
import { ContactUsCategoryController } from './contact-us-category.controller';
import { ContactUsCategoryService } from './contact-us-category.service';

describe('ContactUsCategoryController', () => {
  let controller: ContactUsCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactUsCategoryController],
      providers: [ContactUsCategoryService],
    }).compile();

    controller = module.get<ContactUsCategoryController>(ContactUsCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
