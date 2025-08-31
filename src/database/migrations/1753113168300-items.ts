import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class Items1753113168300 implements MigrationInterface {
  private readonly tableName = 'items';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true, length: '36' },
          { name: 'name', type: 'varchar', length: '128' },
          { name: 'price', type: 'int', default: 0 },
          { name: 'order', type: 'int', default: 0 },
          { name: 'categories', type: 'json', isNullable: true },
          { name: 'tags', type: 'json', isNullable: true },
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
