import { PartialType } from '@nestjs/swagger';
import { CreateZoomDto } from './create-zoom.dto';

export class UpdateZoomDto extends PartialType(CreateZoomDto) {}
