import { IsOptional } from "class-validator";

export class SearchHistoryDto {
  @IsOptional()
  keyword: string;

  @IsOptional()
  accountId: string;
}
