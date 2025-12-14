import { Test, TestingModule } from '@nestjs/testing';
import { BoookImagesController } from './boook-images.controller';
import { BoookImagesService } from './boook-images.service';

describe('BoookImagesController', () => {
  let controller: BoookImagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoookImagesController],
      providers: [BoookImagesService],
    }).compile();

    controller = module.get<BoookImagesController>(BoookImagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
