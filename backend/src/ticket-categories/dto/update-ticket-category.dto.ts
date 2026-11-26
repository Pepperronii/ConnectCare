import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateTicketCategoryDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  categoryName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;
}