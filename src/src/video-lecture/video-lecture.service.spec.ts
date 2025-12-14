import { Test, TestingModule } from '@nestjs/testing';
import { VideoLectureService } from './video-lecture.service';

describe('VideoLectureService', () => {
  let service: VideoLectureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VideoLectureService],
    }).compile();

    service = module.get<VideoLectureService>(VideoLectureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
