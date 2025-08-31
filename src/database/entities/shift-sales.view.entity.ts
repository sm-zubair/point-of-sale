import { ManyToOne, PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';
import Shift from './shift.entity';

@ViewEntity('shift_sales', { schema: 'public' })
export default class ShiftSalesView {
  @PrimaryColumn()
  shiftId!: string;

  @ViewColumn()
  waiter!: string;

  @ViewColumn()
  waiterNetSales!: number;

  @ViewColumn()
  waiterCommission!: number;

  @ViewColumn()
  dineIn!: number;

  @ViewColumn()
  grossDineIn!: number;

  @ViewColumn()
  takeAway!: number;

  @ViewColumn()
  grossTakeAway!: number;

  @ViewColumn()
  delivery!: number;

  @ViewColumn()
  grossDelivery!: number;

  @ManyToOne(() => Shift, (shift) => shift.sales)
  shift!: Shift;
}
