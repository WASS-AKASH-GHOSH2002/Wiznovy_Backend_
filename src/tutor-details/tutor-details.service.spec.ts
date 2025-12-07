import { Test, TestingModule } from '@nestjs/testing';
import { TutorDetailsService } from './tutor-details.service';

describe('TutorDetailsService', () => {
  let service: TutorDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TutorDetailsService],
    }).compile();

    service = module.get<TutorDetailsService>(TutorDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
