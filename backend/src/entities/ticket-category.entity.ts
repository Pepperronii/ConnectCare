import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('ticket_categories')
export class TicketCategory {
  @PrimaryGeneratedColumn()
  categoryId!: number;

  @Column({ length: 80, unique: true })
  categoryName!: string;

@Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;
}