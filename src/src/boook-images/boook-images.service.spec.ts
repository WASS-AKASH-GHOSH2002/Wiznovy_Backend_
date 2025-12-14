import { Test, TestingModule } from '@nestjs/testing';
import { BoookImagesService } from './boook-images.service';

describe('BoookImagesService', () => {
  let service: BoookImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BoookImagesService],
    }).compile();

    service = module.get<BoookImagesService>(BoookImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
