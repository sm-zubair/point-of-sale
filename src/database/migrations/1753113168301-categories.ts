import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class Categories1753113168301 implements MigrationInterface {
  private readonly tableName = 'categories';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true, length: '36' },
          { name: 'name', type: 'varchar', length: '128' },
          { name: 'price', type: 'int', default: 0 },
          { name: 'order', type: 'int', default: 0 },
          { name: 'categoryId', type: 'varchar', length: '128', isNullable: true },
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
