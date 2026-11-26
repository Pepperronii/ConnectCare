import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  userId!: number;

  @Column({ length: 100 })
  fullName!: string;

  @Column({ length: 150, unique: true })
  email!: string;

  @Column({ length: 255, select: false })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: ['Customer', 'Staff', 'Admin'],
    default: 'Customer',
  })
  role!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}