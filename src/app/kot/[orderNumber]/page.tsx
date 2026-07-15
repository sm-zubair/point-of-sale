import React from 'react';
import { getOrder } from '../../../actions';

export default async function KOT({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;

  const items = {};
  const order = await getOrder({
    where: {
      orderNumber: orderNumber,
    },
    include: { items: true },
  });

  for (const item of order?.items.sort((a, b) => a.category.localeCompare(b.category)) ?? []) {
    items[item.category] = items[item.category] || [];
    items[item.category].push(item);
  }

  return (
    <div className="mr-2 -ml-2 border-2 border-solid bg-white p-2 text-[10px] text-black">
      <div className="my-2 border-2 border-solid p-2">
        <div className="text-center text-base font-bold">KOT # {order?.orderNumber}</div>
        <div className="flex items-center justify-between">
          <div>Date: {order?.createdAt?.toLocaleDateString('en-UK')}</div>
          <div>Time: {order?.createdAt?.toLocaleTimeString('en-US')}</div>
        </div>
        <div className="flex items-center justify-between">
          <div>Type: {order?.type}</div>
          {order?.waiter && <div>Waiter: {order?.waiter}</div>}
        </div>
        {order?.customer && (
          <div className="flex items-center justify-between">
            <div>Customer: {order?.customer}</div>
          </div>
        )}
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-[70%] text-left">Item</th>
            <th className="w-[30%] text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(items ?? {}).map(([cat, t]) => (
            <React.Fragment key={cat}>
              <tr>
                <td colSpan={2} className="border-0 border-t border-solid text-left font-semibold">
                  {cat}
                </td>
              </tr>
              {(t as any[]).map((item) => (
                <tr key={item.itemId}>
                  <td className="pl-2">{item.name}</td>
                  <td className="pr-3 text-right">{item.quantity}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
