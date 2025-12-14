import { PartialType } from '@nestjs/mapped-types';
import { CreateBoookImageDto } from './create-boook-image.dto';

export class UpdateBoookImageDto extends PartialType(CreateBoookImageDto) {}