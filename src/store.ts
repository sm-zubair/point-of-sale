import { categories, discounts, items, order_details, orders, shifts, staff } from '@prisma/client';
import { create } from 'zustand';

const store = create<{
  shift: shifts | null;
  staff: staff[];
  categories: categories[];
  items: items[];
  orders: orders[];
  discounts: discounts[];
  autoApplyDiscounts: discounts[];
  accounts: string[];
  order: Partial<orders & { items: order_details[] }> | null;
}>(() => {
  return {
    shift: null,
    staff: [],
    categories: [],
    items: [],
    orders: [],
    discounts: [],
    autoApplyDiscounts: [],
    accounts: [],
    order: null,
  };
});

export default store;
