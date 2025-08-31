import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class Staff1753113168302 implements MigrationInterface {
  private readonly tableName = 'staff';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true, length: '36' },
          { name: 'name', type: 'varchar', length: '128' },
          { name: 'phone', type: 'varchar', length: '128' },
          { name: 'commission', type: 'int', default: 0 },
          { name: 'isServing', type: 'boolean', default: true },
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
