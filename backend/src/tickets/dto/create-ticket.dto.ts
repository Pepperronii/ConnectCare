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

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  description!: string;

  @IsOptional()
  @IsIn(['Low', 'Normal', 'High'])
  priority?: string;
}