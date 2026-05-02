import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength, registerDecorator, ValidationOptions } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, Level, LanguageProficiency } from 'src/enum';

function WordCount(min: number, max: number, options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'wordCount',
      target: object.constructor,
      propertyName,
      options: { message: `${propertyName} must be between ${min} and ${max} words`, ...options },
      validator: {
        validate(value: string) {
          if (typeof value !== 'string') return false;
          const count = value.trim().split(/\s+/).filter(Boolean).length;
          return count >= min && count <= max;
        },
      },
    });
  };
}

// Step 1 - Personal Info
export class TutorStep1Dto {


  @ApiProperty({ example: '1985-01-01' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  dob: Date;

  @ApiProperty({ enum: Gender })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;
}

// Step 2 - Subject & Expertise
export class TutorStep2Dto {
  @ApiProperty({ example: 'uuid' })
  @IsNotEmpty()
  @IsString()
  subjectId: string;
}

// Step 3 - Location & Language
export class TutorStep3Dto {
  @ApiProperty({ example: 'uuid' })
  @IsNotEmpty()
  @IsString()
  countryId: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  stateId: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  cityId: string;
}

// Step 4 - Profile Details
export class TutorStep4Dto {
  @ApiProperty({ example: 'uuid' })
  @IsNotEmpty()
  @IsString()
  budgetId: string;
}

// Step 6 - Teaching Experience
export class TutorStep6Dto {
  @ApiProperty({ example: 5, description: 'Years of teaching experience' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  teachingExperience: number;
}

// Step 7 - Language & Proficiency
export class TutorStep7Dto {
  @ApiProperty({ example: 'uuid' })
  @IsNotEmpty()
  @IsString()
  languageId: string;

  @ApiProperty({ enum: LanguageProficiency })
  @IsNotEmpty()
  @IsEnum(LanguageProficiency)
  languageProficiency: LanguageProficiency;
}

// Step 8 - Document Upload (Formats: JPG, PNG, PDF)
export class TutorStep8Dto {
  @ApiPropertyOptional({ description: 'Document file path (JPG, PNG, PDF accepted)', example: '/uploads/doc.pdf' })
  @IsOptional()
  @IsString()
  document: string;

  @ApiPropertyOptional({ example: 'doc.pdf' })
  @IsOptional()
  @IsString()
  documentName: string;
}

// Step 9 - Bio (min 15 words, max 80 words)
export class TutorStep9Dto {
  @ApiProperty({ example: 'I am an experienced tutor...', description: 'Bio (min 15 words, max 80 words)' })
  @IsNotEmpty()
  @IsString()
  @WordCount(15, 80)
  bio: string;
}

// Step 10 - Hourly Rate & Trial Rate
export class TutorStep10Dto {
  @ApiProperty({ example: 20.00, description: 'Hourly rate' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  hourlyRate: number;

  @ApiProperty({ example: 10.00, description: 'Trial session rate' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  trailRate: number;
}

// Step 11 - Introduction Video
export class TutorStep11Dto {
  @ApiPropertyOptional({ example: '/uploads/intro.mp4', description: 'Introduction video file path' })
  @IsOptional()
  @IsString()
  introductionVideo: string;

  @ApiPropertyOptional({ example: 'intro.mp4' })
  @IsOptional()
  @IsString()
  introductionVideoPath: string;
}

// Step 5 - Qualification & Certification
export class TutorStep5Dto {
  @ApiProperty({ example: 'uuid' })
  @IsNotEmpty()
  @IsString()
  qualificationId: string;

  @ApiPropertyOptional({ description: 'Certification file path (JPG, PNG, PDF accepted)', example: '/uploads/cert.pdf' })
  @IsOptional()
  @IsString()
  qualificationCertification: string;

  @ApiPropertyOptional({ example: 'cert.pdf' })
  @IsOptional()
  @IsString()
  qualificationCertificationName: string;
}
