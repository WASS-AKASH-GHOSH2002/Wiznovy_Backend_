import { IsEnum, IsOptional } from 'class-validator';
import { CommonPaginationDto } from 'src/common/dto/common-pagination.dto';
import { UserRole } from 'src/enum';

export class LoginHistoryFilterDto extends CommonPaginationDto {
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}