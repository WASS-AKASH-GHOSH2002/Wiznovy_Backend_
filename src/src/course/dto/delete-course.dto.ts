import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteCourseDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}