import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class OrderDetails1753113168304 implements MigrationInterface {
  private readonly tableName = 'order_details';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          { name: 'orderId', type: 'varchar', length: '36', isPrimary: true },
          { name: 'itemId', type: 'varchar', length: '36', isPrimary: true },
          { name: 'categoryId', type: 'varchar', length: '36', isPrimary: true },
          { name: 'category', type: 'varchar', length: '128' },
          { name: 'name', type: 'varchar', length: '128' },
          { name: 'quantity', type: 'int', default: 0 },
          { name: 'price', type: 'int', default: 0 },
          { name: 'originalPrice', type: 'int', default: 0 },
          { name: 'totalAmount', type: 'int', default: 0 },
        ],
        indices: [{ columnNames: ['orderId', 'itemId', 'categoryId'] }],
        foreignKeys: [],
      }),
      true
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName, true, true, true);
  }
}
