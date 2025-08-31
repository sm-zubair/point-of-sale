import { PrimaryColumn, ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity('statistics', { schema: 'public' })
export default class StatisticsView {
  @PrimaryColumn()
  shiftId!: string;

  @ViewColumn()
  totalOrders!: number;

  @ViewColumn()
  dineIn!: number;

  @ViewColumn()
  takeAway!: number;

  @ViewColumn()
  delivery!: number;

  @ViewColumn()
  cash!: number;

  @ViewColumn()
  bank!: number;

  @ViewColumn()
  online!: number;

  @ViewColumn()
  onlineDue!: number;

  @ViewColumn()
  credit!: number;
}
