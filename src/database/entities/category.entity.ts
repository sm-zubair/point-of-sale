import { Column, Entity, PrimaryColumn } from 'typeorm';
import BaseEntity from './base.entity';

@Entity({ name: 'categories' })
export default class Category extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  categoryId: string | null;
}
