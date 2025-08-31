import { Column, Entity, JoinColumn, OneToMany, PrimaryColumn } from 'typeorm';
import OrderStatus from '../../constants/order-status';
import BaseEntity from './base.entity';
import OrderDetail from './order-detail.entity';

@Entity({ name: 'orders' })
export default class Order extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 128 })
  orderNumber: string;

  @Column({ type: 'varchar', length: 128 })
  type: string;

  @Column({ type: 'varchar', length: 128 })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 128, nullable: true })
  waiter: string | null;

  @Column({ type: 'int', default: 0 })
  total: number;

  @Column({ type: 'int', default: 0 })
  discount: number;

  @Column({ type: 'int', default: 0 })
  tip: number;

  @Column({ type: 'int', default: 0 })
  net: number;

  @Column({ type: 'int', default: 0 })
  commission: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  payment: string | null;

  @Column({ type: 'varchar', length: 36 })
  shiftId: string;

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order, {
    cascade: true,
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  items: OrderDetail[];
}
