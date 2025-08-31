import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import BaseEntity from './base.entity';
import ShiftSalesView from './shift-sales.view.entity';
import StatisticsView from './statistics.view.entity';

@Entity({ name: 'shifts' })
export default class Shift extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'datetime', default: 'CURRENT_TIMESTAMP' })
  openAt!: Date;

  @Column('datetime', { nullable: true })
  closeAt?: Date;

  @Column({ type: 'varchar', length: 128 })
  openingStaff!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  closingStaff?: string;

  @Column({ type: 'int' })
  openingBalance!: number;

  @Column({ type: 'int', nullable: true })
  closingBalance?: number;

  @OneToOne(() => StatisticsView, { nullable: true })
  @JoinColumn({
    name: 'id',
    referencedColumnName: 'shiftId',
  })
  statistics!: StatisticsView;

  @OneToMany(() => ShiftSalesView, (shiftSales) => shiftSales.shift)
  sales!: ShiftSalesView[];
}
