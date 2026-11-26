import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateTicketCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  categoryName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;
}