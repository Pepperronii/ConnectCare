import {
  IsString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  serviceAddress!: string;
}