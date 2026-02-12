import { PartialType } from '@nestjs/swagger';
import { CreateSavedBookDto } from './create-saved-book.dto';

export class UpdateSavedBookDto extends PartialType(CreateSavedBookDto) {}
