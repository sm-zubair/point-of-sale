import React from 'react';
import { getOrder } from '../../../actions';

export default async function Bill({ params }: { params: Promise<{ orderNumber: string }> }) {
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
      <div className="flex items-center justify-center">
        <img src="./logo.png" alt="Logo" width={100} height={100} />
      </div>
      <div className="text-center">Shop # 3 Freddys Food Court Malir Cantt</div>
      <div className="my-2 border-2 border-solid p-2">
        <div className="text-center text-base">BILL # {order?.orderNumber}</div>
        <div className="flex items-center justify-between">
          <div>Date: {order?.createdAt?.toLocaleDateString('en-UK')}</div>
          <div>Time: {order?.createdAt?.toLocaleTimeString('en-US')}</div>
        </div>
        <div className="flex items-center justify-between">
          <div>Waiter: {order?.waiter}</div>
          <div>Type: {order?.type}</div>
        </div>
        <div className="flex items-center justify-between">
          <div>Payment: {order?.payment}</div>
          <div>Status: {order?.status}</div>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-[40%] text-left">Item</th>
            <th className="w-[10%] pr-3 text-right">Qty</th>
            <th className="w-[10%] pr-3 text-right">Price</th>
            <th className="w-[10%] pr-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(items ?? {}).map(([cat, t]) => (
            <React.Fragment key={cat}>
              <tr>
                <td colSpan={4} className="border-0 border-t border-solid text-left font-semibold">
                  {cat}
                </td>
              </tr>
              {(t as any[]).map((item) => (
                <tr key={item.itemId}>
                  <td className="pl-2">{item.name}</td>
                  <td className="pr-3 text-right">{item.quantity}</td>
                  <td className="pr-3 text-right">{item.originalPrice}</td>
                  <td className="pr-3 text-right">{item.totalAmount.toLocaleString({ maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
        <tfoot className="text-xs">
          <tr>
            <td colSpan={4} className="border-0 border-b border-solid"></td>
          </tr>
          <tr>
            <td colSpan={3} className="text-left">
              Gross Total
            </td>
            <td className="pr-3 text-right">{order?.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
          </tr>
          <tr>
            <td colSpan={3} className="text-left">
              Discount
            </td>
            <td className="pr-3 text-right">
              {order?.discountValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </td>
          </tr>
          <tr>
            <th colSpan={3} className="text-left">
              Net
            </th>
            <th className="pr-3 text-right font-bold">
              {order?.net.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </th>
          </tr>
        </tfoot>
      </table>
      <div className="my-2 border-2 border-solid p-2">
        <div className="text-center">
          Online Payment : {process.env.NEXT_PUBLIC_ONLINE_PAYMENT_NUMBER} {process.env.NEXT_PUBLIC_ONLINE_PAYMENT_NAME}
        </div>
        <div className="mt-2 text-center">JazzCash, SadaPay, Easypaisa</div>
        <div className="mt-2 text-center text-[8px]">
          *All collected remaining change will be donated to various charities
        </div>
      </div>
      <script>console.log('print....'); window.print();</script>
    </div>
  );
}
