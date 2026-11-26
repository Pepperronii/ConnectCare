import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTicketStatusHistoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string | null;
}