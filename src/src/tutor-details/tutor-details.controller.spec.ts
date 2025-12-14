import { Test, TestingModule } from '@nestjs/testing';
import { TutorDetailsController } from './tutor-details.controller';
import { TutorDetailsService } from './tutor-details.service';

describe('TutorDetailsController', () => {
  let controller: TutorDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TutorDetailsController],
      providers: [TutorDetailsService],
    }).compile();

    controller = module.get<TutorDetailsController>(TutorDetailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
