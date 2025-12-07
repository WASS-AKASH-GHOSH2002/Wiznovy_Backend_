import { PartialType } from '@nestjs/swagger';
import { CreateVideoLectureDto } from './create-video-lecture.dto';

export class UpdateVideoLectureDto extends PartialType(CreateVideoLectureDto) {}
