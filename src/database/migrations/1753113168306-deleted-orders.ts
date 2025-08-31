import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class DeletedOrders1753113168306 implements MigrationInterface {
  private readonly tableName = 'deleted_orders';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true, length: '36' },
          { name: 'orderNumber', type: 'varchar', length: '128' },
          { name: 'type', type: 'varchar', length: '128' },
          { name: 'status', type: 'varchar', length: '128' },
          { name: 'reason', type: 'varchar', length: '512' },
          { name: 'total', type: 'int', default: 0 },
          { name: 'discount', type: 'int', default: 0 },
          { name: 'commission', type: 'int', default: 0 },
          { name: 'net', type: 'int', default: 0 },
          { name: 'items', type: 'json' },
          { name: 'waiter', type: 'varchar', length: '128', isNullable: true },
          { name: 'payment', type: 'varchar', length: '128', isNullable: true },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
        indices: [{ columnNames: ['id'] }],
        foreignKeys: [],
      }),
      true
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName, true, true, true);
  }
}
