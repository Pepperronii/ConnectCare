import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('customer_profiles')
export class CustomerProfile {
  @PrimaryGeneratedColumn()
  customerId!: number;

  @Column({ unique: true })
  userId!: number;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ length: 20 })
  phoneNumber!: string;

  @Column({ length: 255 })
  serviceAddress!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}