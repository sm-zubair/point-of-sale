'use server';
import { Prisma, PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

//Shifts
export async function getShifts(options: Prisma.shiftsFindManyArgs) {
  const shifts = await db.shifts.findMany(options);
  return shifts;
}
export async function getShift(options: Prisma.shiftsFindFirstArgs) {
  return await db.shifts.findFirst(options);
}
export async function createShift(params: Prisma.shiftsCreateArgs) {
  params.data = {
    ...params.data,
    openingBalance: parseInt(params.data.openingBalance.toString()),
  };
  return await db.shifts.create(params);
}

//Staff
export async function getStaff(options: Prisma.staffFindManyArgs) {
  return await db.staff.findMany(options);
}
export async function createStaff(params: Prisma.staffCreateArgs) {
  params.data = {
    ...params.data,
    commission: parseInt(params.data.commission.toString()),
  };
  return await db.staff.create(params);
}
export async function updateStaff(params: Prisma.staffUpdateArgs) {
  params.data = {
    ...params.data,
    commission: parseInt(params.data.commission.toString()),
  };
  return await db.staff.update(params);
}
export async function removeStaff(options: Prisma.staffDeleteArgs) {
  return await db.staff.delete(options);
}

//Categories
export async function getCategories(params: Prisma.categoriesFindManyArgs) {
  return db.categories.findMany(params);
}
export async function createCategory(params: Prisma.categoriesCreateArgs) {
  params.data = {
    ...params.data,
    price: parseInt(params.data.price.toString()),
    order: parseInt(params.data.order.toString()),
  };
  return await db.categories.create(params);
}
export async function updateCategory(params: Prisma.categoriesUpdateArgs) {
  params.data = {
    ...params.data,
    price: parseInt(params.data.price.toString()),
    order: parseInt(params.data.order.toString()),
  };
  return await db.categories.update(params);
}
export async function removeCategory(options: Prisma.categoriesDeleteArgs) {
  return await db.categories.delete(options);
}

//accounts
export async function getAccounts(params: Prisma.accountsFindManyArgs) {
  return db.accounts.findMany(params);
}
export async function createAccount(params: Prisma.accountsCreateArgs) {
  return await db.accounts.create(params);
}
export async function updateAccount(params: Prisma.accountsUpdateArgs) {
  return await db.accounts.update(params);
}
export async function removeAccount(options: Prisma.accountsDeleteArgs) {
  return await db.accounts.delete(options);
}

//Items
export async function getItems(params: Prisma.itemsFindManyArgs) {
  return db.items.findMany(params);
}
export async function createItem(params: Prisma.itemsCreateArgs) {
  params.data = {
    ...params.data,
    price: parseInt(params.data.price.toString()),
    order: parseInt(params.data.order.toString()),
  };
  return await db.items.create(params);
}
export async function updateItem(params: Prisma.itemsUpdateArgs) {
  params.data = {
    ...params.data,
    price: parseInt(params.data.price.toString()),
    order: parseInt(params.data.order.toString()),
  };
  return await db.items.update(params);
}
export async function removeItem(options: Prisma.itemsDeleteArgs) {
  return await db.items.delete(options);
}

//Discounts
export async function getDiscounts(params: Prisma.discountsFindManyArgs) {
  return db.discounts.findMany(params);
}
export async function createDiscount(params: Prisma.discountsCreateArgs) {
  params.data = {
    ...params.data,
    value: parseInt(params.data.value.toString()),
  };
  return await db.discounts.create(params);
}
export async function updateDiscount(params: Prisma.discountsUpdateArgs) {
  params.data = {
    ...params.data,
    value: parseInt(params.data.value.toString()),
  };
  return await db.discounts.update(params);
}
export async function removeDiscount(options: Prisma.discountsDeleteArgs) {
  return await db.discounts.delete(options);
}

//orders
export async function getOrders(params: Prisma.ordersFindManyArgs) {
  return db.orders.findMany(params);
}
export async function createOrder(params: Prisma.ordersCreateArgs) {
  return await db.orders.create(params);
}
export async function updateOrder(params: Prisma.ordersUpdateArgs) {
  return await db.orders.update(params);
}
export async function removeOrder(options: Prisma.ordersDeleteArgs) {
  return await db.orders.delete(options);
}
export async function removeOrderDetails(options: Prisma.order_detailsDeleteManyArgs) {
  return await db.order_details.deleteMany(options);
}

//customers
export async function getUniqueCustomers() {
  return db.orders.findMany({
    distinct: 'customer',
    select: {
      customer: true,
    },
    where: {
      customer: {
        not: null,
      },
    },
  });
}

//order_deletes
export async function createOrderDelete(params: Prisma.deleted_ordersCreateArgs) {
  return await db.deleted_orders.create(params);
}

//Notes
export async function saveNotes(notes: string) {
  //write txt file for notes
  fs.writeFileSync('notes.txt', notes);
}

export async function getNotes() {
  //read txt file for notes
  return fs.readFileSync('notes.txt', 'utf8');
}
