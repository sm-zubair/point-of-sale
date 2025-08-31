import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class Orders1753113168303 implements MigrationInterface {
  private readonly tableName = 'orders';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true, length: '36' },
          { name: 'orderNumber', type: 'varchar', length: '128' },
          { name: 'type', type: 'varchar', length: '128' },
          { name: 'status', type: 'varchar', length: '128' },
          { name: 'waiter', type: 'varchar', length: '128', isNullable: true },
          { name: 'payment', type: 'varchar', length: '128', isNullable: true },
          { name: 'total', type: 'int', default: 0 },
          { name: 'discount', type: 'int', default: 0 },
          { name: 'commission', type: 'int', default: 0 },
          { name: 'tip', type: 'int', default: 0 },
          { name: 'net', type: 'int', default: 0 },
          { name: 'shiftId', type: 'varchar', length: '36' },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
        indices: [{ columnNames: ['id', 'shiftId'] }],
        foreignKeys: [],
      }),
      true
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName, true, true, true);
  }
}
