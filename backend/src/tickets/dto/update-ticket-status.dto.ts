import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTicketStatusDto {
  @IsIn(['Pending', 'In Progress', 'Resolved'])
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string | null;
}