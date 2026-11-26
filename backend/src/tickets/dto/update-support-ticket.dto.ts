import {
  IsInt,
  IsPositive,
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateSupportTicketDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @IsPositive()
  categoryId?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  subject?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  description?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsIn(['Low', 'Normal', 'High'])
  priority?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsIn(['Pending', 'In Progress', 'Resolved'])
  status?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  assignedStaffId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string | null;
}