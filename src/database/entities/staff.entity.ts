import { Column, Entity, PrimaryColumn } from 'typeorm';
import BaseEntity from './base.entity';

@Entity({ name: 'staff' })
export default class Staff extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 128 })
  phone: string;

  @Column({ type: 'int', default: 0 })
  commission: number;

  @Column({ type: 'boolean', default: true })
  isServing: boolean;
}
