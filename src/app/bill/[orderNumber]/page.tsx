'use client';
import { orders } from '@prisma/client';
import { useParams } from 'next/navigation';
import { Divider } from 'primereact/divider';
import { useEffect, useState } from 'react';
import { getOrder } from '../../../actions';

export default function Bill() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<orders | null>(null);

  useEffect(() => {
    (async () => {
      const order = await getOrder({ where: { orderNumber: orderNumber as string }, include: { items: true } });
      console.log(`🚀 --------------------------------🚀`);
      console.log(`🚀 | page.tsx:12 | order:`, order);
      console.log(`🚀 --------------------------------🚀`);
      setOrder(order);
    })();
  }, []);

  return (
    <div className="bg-white text-xs text-black">
      <div className="mx-auto w-[75mm] border border-solid p-2">
        <div className="flex items-center justify-center">
          <img src="./logo.png" alt="Logo" width={100} height={100} />
        </div>
        <div className="text-center">Shop # 3 Freddys Food Court Malir Cantt</div>
        <div className="my-2 border border-solid p-1">
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
        <table className="w-full border border-solid">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          {/* <tbody>
            {order?..map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{item.originalPrice}</td>
                <td>{item.totalAmount}</td>
              </tr>
            ))}
          </tbody> */}
        </table>
        <div className="grid grid-cols-5 gap-1">
          <div className="col-span-2">Item</div>
          <div className="text-center">Qty</div>
          <div className="text-center">Price</div>
          <div className="text-center">Total</div>

          {/* {order?.items.map((item) => (
            <>
              <div className="col-span-2">{item.name}</div>
              <div className="text-center">{item.quantity}</div>
              <div className="text-center">
                {item.originalPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-center">
                {item.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </>
          ))} */}
          <Divider className="col-span-5 my-2" />
          <div className="col-span-4">Gross Total: </div>
          <div className="text-center">{order?.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
          <div className="col-span-4">Discount: </div>
          <div className="text-center">
            {order?.discountValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <Divider className="col-span-5 my-2" />
          <div className="col-span-4 font-bold">Net: </div>
          <div className="text-center font-bold">
            {order?.net.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <Divider className="col-span-5 my-2" />
        </div>

        <div className="my-2 border border-solid p-1">
          <div className="text-center text-base">Online Payment : {process.env.ONLINE_PAYMENT_NUMBER}</div>
          <div className="text-center">({process.env.ONLINE_PAYMENT_NAME})</div>
          <div className="text-center">JazzCash, SadaPay, Easypaisa</div>
        </div>
      </div>
    </div>
  );
}
