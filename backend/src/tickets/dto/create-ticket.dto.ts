import { Transform } from 'class-transformer';
import {
  IsInt,
  IsPositive,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateTicketDto {
  @IsInt()
  @IsPositive()
  categoryId!: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  subject!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  description!: string;

  @IsOptional()
  @IsIn(['Low', 'Normal', 'High'])
  priority?: string;
}