import { PartialType } from '@nestjs/swagger';
import { CreateWalkThroughDto } from './create-walk-through.dto';

export class UpdateWalkThroughDto extends PartialType(CreateWalkThroughDto) {}
