import { MigrationInterface, QueryRunner } from 'typeorm';

export default class ViewShiftSales1753113168401 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE OR REPLACE VIEW shift_sales AS SELECT
          shiftId,
          waiter,	
          SUM( net ) AS waiterNetSales,
          SUM( net * ( commission / 100 )) AS waiterCommission,
          SUM( CASE WHEN type = 'dine-in' THEN net ELSE 0 END ) AS dineIn,
          SUM( CASE WHEN type = 'dine-in' THEN total ELSE 0 END ) AS grossDineIn,
          SUM( CASE WHEN type = 'take-away' THEN net ELSE 0 END ) AS takeAway,
          SUM( CASE WHEN type = 'take-away' THEN total ELSE 0 END ) AS grossTakeAway,
          SUM( CASE WHEN type = 'delivery' THEN net ELSE 0 END ) AS delivery,
          SUM( CASE WHEN type = 'delivery' THEN total ELSE 0 END ) AS grossDelivery	
        FROM
          orders 
        GROUP BY
          waiter,
          shiftId;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP VIEW shift_sales');
  }
}
