import { Test, TestingModule } from '@nestjs/testing';
import { VideoLectureController } from './video-lecture.controller';
import { VideoLectureService } from './video-lecture.service';

describe('VideoLectureController', () => {
  let controller: VideoLectureController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoLectureController],
      providers: [VideoLectureService],
    }).compile();

    controller = module.get<VideoLectureController>(VideoLectureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
