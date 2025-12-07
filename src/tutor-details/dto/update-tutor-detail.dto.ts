import { PartialType } from '@nestjs/swagger';
import { CreateTutorDetailDto } from './create-tutor-detail.dto';

export class UpdateTutorDetailDto extends PartialType(CreateTutorDetailDto) {}
