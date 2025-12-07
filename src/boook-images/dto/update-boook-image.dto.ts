import { PartialType } from '@nestjs/swagger';
import { CreateBoookImageDto } from './create-boook-image.dto';

export class UpdateBoookImageDto extends PartialType(CreateBoookImageDto) {}
