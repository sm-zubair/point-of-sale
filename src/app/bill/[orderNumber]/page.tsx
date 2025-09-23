import { PrismaClient } from '@prisma/client';
import { Divider } from 'primereact/divider';

export default async function Bill({ params }: { params: { orderNumber: string } }) {
  const { orderNumber } = await params;
  const db = new PrismaClient();
  const order = await db.orders.findFirst({ where: { orderNumber }, include: { items: true } });

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
        <div className="grid grid-cols-5 gap-1">
          <div className="col-span-2">Item</div>
          <div className="text-center">Qty</div>
          <div className="text-center">Price</div>
          <div className="text-center">Total</div>

          {order?.items.map((item) => (
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
          ))}
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
