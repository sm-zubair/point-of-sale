'use server';

import { instanceToPlain } from 'class-transformer';
import fs from 'fs';
import 'reflect-metadata';
import {
  DataSource,
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  IsNull,
  QueryRunner,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import OrderStatus from './constants/order-status';
import * as Entities from './database/entities';
import { Order, OrderDetail } from './database/entities';
import DeletedOrder from './database/entities/deleted-order.entity';
import * as migrations from './database/migrations';
import uuid from './helpers/uuid';

const dataSource = new DataSource({
  type: 'mysql',
  database: process.env.DATABASE_NAME,
  host: 'localhost',
  port: 3306,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  ssl: false,
  logging: true,
  entities: Object.values(Entities),
  // subscribers: Object.values(subscribers) ?? [],
  migrations: migrations,
  migrationsTransactionMode: 'all',
  migrationsRun: false,
  // synchronize: false,
  extra: {
    connectionLimit: 10, // Limit the number of connections in the pool
    connectTimeout: 10000, // 10 seconds
  },
});

export async function runMigrations() {
  if (!dataSource.isInitialized) await dataSource.initialize();
  await dataSource.runMigrations();
}

export async function get<N extends keyof typeof Entities, T extends InstanceType<(typeof Entities)[N]>>(
  name: N,
  options: FindOneOptions<T>
) {
  if (!dataSource.isInitialized) await dataSource.initialize();
  const result = await dataSource.getRepository<T>(dataSource.getMetadata(name).target).findOne(options);
  return instanceToPlain(result) as T;
}

export async function getAll<N extends keyof typeof Entities, T extends InstanceType<(typeof Entities)[N]>>(
  name: N,
  options: FindManyOptions<T>
) {
  if (!dataSource.isInitialized) await dataSource.initialize();
  const result = await dataSource.getRepository<T>(dataSource.getMetadata(name).target).find(options);
  return instanceToPlain(result) as T[];
}

export async function create<N extends keyof typeof Entities, T extends InstanceType<(typeof Entities)[N]>>(
  name: N,
  entity: DeepPartial<T>
) {
  if (!dataSource.isInitialized) await dataSource.initialize();
  const repository = dataSource.getRepository<T>(dataSource.getMetadata(name).target);
  entity = repository.create({
    ...entity,
  });
  entity.id = entity?.id || uuid();
  return instanceToPlain(await repository.save(entity)) as T;
}

export async function update<N extends keyof typeof Entities, T extends InstanceType<(typeof Entities)[N]>>(
  name: N,
  criteria: FindOptionsWhere<T>,
  entity: QueryDeepPartialEntity<T>
) {
  if (!dataSource.isInitialized) await dataSource.initialize();
  const repository = dataSource.getRepository<T>(dataSource.getMetadata(name).target);
  const result = await repository.update(criteria, entity);
  return !!result.affected;
}

export async function remove<N extends keyof typeof Entities, T extends InstanceType<(typeof Entities)[N]>>(
  name: N,
  criteria: FindOptionsWhere<T>
) {
  if (!dataSource.isInitialized) await dataSource.initialize();
  const repository = dataSource.getRepository<T>(dataSource.getMetadata(name).target);
  const result = await repository.delete(criteria);
  return !!result.affected;
}

export async function query<T = any>(query: string, parameters?: any[], queryRunner?: QueryRunner): Promise<T> {
  if (!dataSource.isInitialized) await dataSource.initialize();
  const result = await dataSource.query(query, parameters);
  return result;
}

export async function updateOrder(id: string, order: DeepPartial<Order>, orderDetails: DeepPartial<OrderDetail>[]) {
  try {
    return await dataSource.transaction(async (manager) => {
      const orderRepositoy = manager.getRepository(Order);
      const orderDetailsRepository = manager.getRepository(OrderDetail);
      await orderRepositoy.update({ id }, order);
      await orderDetailsRepository.delete({ orderId: id });
      await orderDetailsRepository.save(orderDetails);
      return instanceToPlain(await orderRepositoy.findOne({ where: { id }, relations: { items: true } }));
    });
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function deleteOrder(id: string, reason: string, status: OrderStatus) {
  try {
    return await dataSource.transaction(async (manager) => {
      const order = await manager.getRepository(Order).findOne({ where: { id }, relations: { items: true } });
      if (!order) return null;
      await manager.getRepository(OrderDetail).delete({ orderId: id });
      await manager.getRepository(Order).delete({ id });
      await manager.getRepository(DeletedOrder).save({
        ...order,
        items: order.items,
        reason,
        status,
      });
      return true;
    });
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function saveNotes(notes: string) {
  //write txt file for notes
  fs.writeFileSync('notes.txt', notes);
}

export async function getNotes() {
  //read txt file for notes
  return fs.readFileSync('notes.txt', 'utf8');
}

export async function getCurrentShift() {
  return await get('Shift', { where: { closeAt: IsNull() } });
}
