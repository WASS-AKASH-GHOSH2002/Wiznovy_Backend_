import { Test, TestingModule } from '@nestjs/testing';
import { StudyMaterialController } from './study-material.controller';
import { StudyMaterialService } from './study-material.service';

describe('StudyMaterialController', () => {
  let controller: StudyMaterialController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudyMaterialController],
      providers: [StudyMaterialService],
    }).compile();

    controller = module.get<StudyMaterialController>(StudyMaterialController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
