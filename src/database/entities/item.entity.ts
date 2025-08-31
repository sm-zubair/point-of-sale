import { Column, Entity, PrimaryColumn } from 'typeorm';
import BaseEntity from './base.entity';

@Entity({ name: 'items' })
export default class Item extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'json', nullable: true })
  categories: string[] | null;

  @Column({ type: 'json', nullable: true })
  tags: string[] | null;
}
