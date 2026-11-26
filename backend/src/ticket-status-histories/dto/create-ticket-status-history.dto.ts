import {
  IsInt,
  IsPositive,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTicketStatusHistoryDto {
  @IsInt()
  @IsPositive()
  ticketId!: number;

  @IsIn(['Pending', 'In Progress', 'Resolved'])
  newStatus!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string | null;
}