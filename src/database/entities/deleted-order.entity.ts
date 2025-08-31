import { Column, Entity, PrimaryColumn } from 'typeorm';
import OrderStatus from '../../constants/order-status';
import BaseEntity from './base.entity';
import OrderDetail from './order-detail.entity';

@Entity({ name: 'deleted_orders' })
export default class DeletedOrder extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 128 })
  orderNumber: string;

  @Column({ type: 'varchar', length: 128 })
  type: string;

  @Column({ type: 'varchar', length: 128 })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 512 })
  reason: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  waiter: string | null;

  @Column({ type: 'int', default: 0 })
  total: number;

  @Column({ type: 'int', default: 0 })
  discount: number;

  @Column({ type: 'int', default: 0 })
  net: number;

  @Column({ type: 'int', default: 0 })
  commission: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  payment: string | null;

  @Column({ type: 'json' })
  items: OrderDetail[];
}
