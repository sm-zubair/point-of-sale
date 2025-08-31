import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class Discounts1753113168305 implements MigrationInterface {
  private readonly tableName = 'discounts';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'name', type: 'varchar', length: '128' },
          { name: 'value', type: 'int', default: 0 },
          { name: 'items', type: 'json', isNullable: true },
          { name: 'categories', type: 'json', isNullable: true },
          { name: 'isActive', type: 'boolean', default: false },
          { name: 'autoApply', type: 'boolean', default: true },
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
