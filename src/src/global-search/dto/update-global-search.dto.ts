import { PartialType } from '@nestjs/swagger';
import { CreateGlobalSearchDto } from './create-global-search.dto';

export class UpdateGlobalSearchDto extends PartialType(CreateGlobalSearchDto) {}
