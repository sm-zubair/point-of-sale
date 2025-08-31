import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class Shifts1753113168307 implements MigrationInterface {
  private readonly tableName = 'shifts';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true, length: '36' },
          { name: 'openAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'closeAt', type: 'datetime', isNullable: true },
          { name: 'openingStaff', type: 'varchar', length: '128' },
          { name: 'closingStaff', type: 'varchar', length: '128', isNullable: true },
          { name: 'openingBalance', type: 'int' },
          { name: 'closingBalance', type: 'int', isNullable: true },
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
