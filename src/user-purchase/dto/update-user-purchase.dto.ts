import { PartialType } from '@nestjs/swagger';
import { CreateUserPurchaseDto } from './create-user-purchase.dto';

export class UpdateUserPurchaseDto extends PartialType(CreateUserPurchaseDto) {}
