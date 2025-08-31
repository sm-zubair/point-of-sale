import { Column, Entity, PrimaryColumn } from 'typeorm';
import BaseEntity from './base.entity';

@Entity({ name: 'discounts' })
export default class Discount extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'int', default: 0 })
  value: number;

  @Column({ type: 'json', nullable: true })
  items: string[] | null;

  @Column({ type: 'json', nullable: true })
  categories: string[] | null;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  autoApply: boolean;
}
