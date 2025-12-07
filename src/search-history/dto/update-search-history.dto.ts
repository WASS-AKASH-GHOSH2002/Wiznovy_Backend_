import { PartialType } from '@nestjs/swagger';
import { CreateSearchHistoryDto } from './create-search-history.dto';

export class UpdateSearchHistoryDto extends PartialType(CreateSearchHistoryDto) {}
