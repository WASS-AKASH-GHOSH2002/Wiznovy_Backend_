import { IsOptional } from 'class-validator';

export class UpdateNewsDto {
  @IsOptional()
  heading: string;

  @IsOptional()
  desc: string;
}
