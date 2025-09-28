'use client';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { getOrder } from '../../../actions';

export default function Bill() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState(null);

  useEffect(() => {
    (async () => {
      const _order = await getOrder({
        where: {
          orderNumber: orderNumber as string,
        },
        include: { items: true },
      });
      const items = {};
      for (const item of _order.items) {
        items[item.category] = items[item.category] || [];
        items[item.category].push(item);
      }
      setItems(items);
      setOrder(_order);
    })();
  }, []);

  return (
    <div className="w-[570px] border-2 border-solid bg-white p-2 text-[14px] text-black">
      <div className="flex items-center justify-center">
        <img src="./logo.png" alt="Logo" width={100} height={100} />
      </div>
      <div className="text-center">Shop # 3 Freddys Food Court Malir Cantt</div>
      <div className="my-2 border-2 border-solid p-2">
        <div className="text-center text-base">BILL # {order?.orderNumber}</div>
        <div className="flex items-center justify-between">
          <div>Date: {order?.createdAt?.toLocaleDateString()}</div>
          <div>Time: {order?.createdAt?.toLocaleTimeString()}</div>
        </div>
        <div className="flex items-center justify-between">
          <div>Waiter: {order?.waiter}</div>
          <div>Type: {order?.type}</div>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-[30%] text-left">Item</th>
            <th className="w-[10%] pr-8 text-right">Qty</th>
            <th className="w-[15%] pr-8 text-right">Price</th>
            <th className="w-[15%] pr-8 text-right">Total</th>
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
                  <td className="pl-4">{item.name}</td>
                  <td className="pr-8 text-right">{item.quantity}</td>
                  <td className="pr-8 text-right">{item.originalPrice}</td>
                  <td className="pr-8 text-right">{item.totalAmount.toLocaleString({ maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
        <tfoot className="text-base">
          <tr>
            <td colSpan={4} className="border-0 border-b border-solid"></td>
          </tr>
          <tr>
            <td colSpan={3} className="text-left">
              Gross Total
            </td>
            <td className="pr-8 text-right">{order?.total.toLocaleString({ maximumFractionDigits: 0 })}</td>
          </tr>
          <tr>
            <td colSpan={3} className="text-left">
              Discount
            </td>
            <td className="pr-8 text-right">{order?.discountValue.toLocaleString({ maximumFractionDigits: 0 })}</td>
          </tr>
          <tr>
            <th colSpan={3} className="text-left">
              Net
            </th>
            <th className="pr-8 text-right font-bold">{order?.net.toLocaleString({ maximumFractionDigits: 0 })}</th>
          </tr>
        </tfoot>
      </table>
      <div className="my-2 border-2 border-solid p-2">
        <div className="flex items-center justify-evenly">
          <div>Online Payment : {process.env.NEXT_PUBLIC_ONLINE_PAYMENT_NUMBER}</div>
          <div>Title: {process.env.NEXT_PUBLIC_ONLINE_PAYMENT_NAME}</div>
        </div>
        <div className="mt-2 text-center">JazzCash, SadaPay, Easypaisa</div>
        <div className="mt-2 text-center text-xs">
          *All collected remaining change will be donated to various charities
        </div>
      </div>
    </div>
  );
}
