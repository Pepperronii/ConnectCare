import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomerProfile } from './customer-profile.entity';
import { TicketCategory } from './ticket-category.entity';
import { User } from './user.entity';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn()
  ticketId!: number;

  @Column()
  customerId!: number;

  @ManyToOne(() => CustomerProfile, { nullable: false })
  @JoinColumn({ name: 'customerId' })
  customer!: CustomerProfile;

  @Column()
  categoryId!: number;

  @ManyToOne(() => TicketCategory, { nullable: false })
  @JoinColumn({ name: 'categoryId' })
  category!: TicketCategory;

  @Column({ type: 'int', nullable: true })
  assignedStaffId!: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedStaffId' })
  assignedStaff!: User | null;

  @Column({ length: 150 })
  subject!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending',
  })
  status!: string;

  @Column({
    type: 'enum',
    enum: ['Low', 'Normal', 'High'],
    default: 'Normal',
  })
  priority!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  resolvedAt!: Date | null;
}