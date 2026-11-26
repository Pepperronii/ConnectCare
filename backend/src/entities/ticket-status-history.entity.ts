import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SupportTicket } from './support-ticket.entity';
import { User } from './user.entity';

@Entity('ticket_status_histories')
export class TicketStatusHistory {
  @PrimaryGeneratedColumn()
  historyId!: number;

  @Column()
  ticketId!: number;

  @ManyToOne(() => SupportTicket, { nullable: false })
  @JoinColumn({ name: 'ticketId' })
  ticket!: SupportTicket;

  @Column()
  updatedByUserId!: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'updatedByUserId' })
  updatedByUser!: User;

  @Column({ type: 'varchar', length: 20, nullable: true })
  previousStatus!: string | null;

  @Column({ length: 20 })
  newStatus!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  remarks!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  changedAt!: Date;
}