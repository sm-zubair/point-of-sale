import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import Order from './order.entity';

@Entity({ name: 'order_details' })
export default class OrderDetail {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  orderId: string;

  @PrimaryColumn({ type: 'varchar', length: 36 })
  itemId: string;

  @PrimaryColumn({ type: 'varchar', length: 128 })
  categoryId: string;

  @Column({ type: 'varchar', length: 128 })
  category: string;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  originalPrice: number;

  @Column({ type: 'int', default: 0 })
  totalAmount: number;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
