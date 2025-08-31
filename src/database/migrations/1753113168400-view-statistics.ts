import { MigrationInterface, QueryRunner } from 'typeorm';

export default class ViewStatistics1753113168400 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE OR REPLACE VIEW statistics AS SELECT
          shiftId,
          COUNT(*) AS totalOrders,
          SUM( CASE WHEN type = 'dine-in' THEN 1 ELSE 0 END ) AS dineIn,
          SUM( CASE WHEN type = 'take-away' THEN 1 ELSE 0 END ) AS takeAway,
          SUM( CASE WHEN type = 'delivery' THEN 1 ELSE 0 END ) AS delivery,
          SUM( CASE WHEN payment = 'cash' THEN net ELSE 0 END ) AS cash,
          SUM( CASE WHEN payment = 'card' THEN net ELSE 0 END ) AS bank,
          SUM( CASE WHEN payment = 'online' AND status = 'paid' THEN net ELSE 0 END ) AS online,
          SUM( CASE WHEN payment = 'online' AND status = 'due' THEN net ELSE 0 END ) AS onlineDue,
          SUM( CASE WHEN payment = 'credit' AND status = 'due' THEN net ELSE 0 END ) AS credit
        FROM
          orders
        GROUP BY
          shiftId;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP VIEW statistics');
  }
}
