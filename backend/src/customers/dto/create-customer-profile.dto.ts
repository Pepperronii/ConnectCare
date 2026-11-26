import { IsInt, Min } from 'class-validator';
import { CreateCustomerDto } from './create-customer.dto';

export class CreateCustomerProfileDto extends CreateCustomerDto {
  @IsInt()
  @Min(1)
  userId!: number;
}