import { Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { DefaultStatus } from "src/enum";

export class CreateCategoryDto {
@IsNotEmpty()
@IsString()
name: string;
}
export class UpdateCategoryStatusDto{
  @IsOptional()
   @IsEnum(DefaultStatus)
   status: DefaultStatus;
}

export class CategoryPginationDto{
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(10)
    @Max(100)
    limit: number;

    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    offset: number;

    @IsOptional()
    @IsString()
    @MinLength(0)
    @MaxLength(100)
    keyword: string;

    @IsOptional()
   @IsEnum(DefaultStatus)
   status: DefaultStatus;  
}







