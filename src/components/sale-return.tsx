import { orders, shifts } from '@prisma/client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { getOrders } from '../actions';

type Props = {
  visible: boolean;
  shift: shifts;
  setVisible: Dispatch<SetStateAction<boolean>>;
};

export default function SaleReturn({ visible, shift, setVisible }: Props) {
  const [orders, setOrders] = useState<orders[]>([]);
  useEffect(() => {
    (async () => {
      const orders = await getOrders({
        where: {
          shiftId: shift.id,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      setOrders(orders);
    })();
  }, []);

  return (
    <Dialog
      header="Sale Return"
      visible={true}
      resizable={false}
      draggable={false}
      onHide={() => {
        setVisible(false);
      }}
      pt={{
        footer: {
          className: 'p-0',
        },
      }}
      style={{
        width: '60%',
      }}
      footer={() => (
        <div className="flex items-center justify-between gap-4 border-0 border-t border-[lightgrey] p-4">
          <Button
            label="Cancel"
            onClick={() => {
              setVisible(false);
            }}
            severity="secondary"
          />
          <Button
            label="Done"
            onClick={() => {
              setVisible(false);
            }}
            severity="success"
          />
        </div>
      )}
    >
      <div className="p-2">
        <DataTable value={orders} className="compact-table border border-solid border-[lightgrey]" stripedRows>
          <Column
            header="#"
            field="orderNumber"
            align="center"
            style={{ width: '40px', textAlign: 'center' }}
            body={(_, { rowIndex }) => {
              return rowIndex + 1;
            }}
          />
          <Column header="Order" field="orderNumber" />
          <Column header="Type" field="type" />
          <Column header="Waiter" field="waiter" />
          <Column header="Status" field="status" align="center" style={{ textAlign: 'center' }} />
          <Column
            header="Gross"
            field="total"
            align="center"
            style={{ textAlign: 'center' }}
            body={(data) => Number(data.total)?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          />
          <Column
            header="Discount"
            field="discountValue"
            align="center"
            style={{ textAlign: 'center' }}
            body={(data) => Number(data.discountValue)?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          />
          <Column
            header="Net"
            field="net"
            align="center"
            style={{ textAlign: 'center' }}
            body={(data) => Number(data.net)?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          />
        </DataTable>
      </div>
    </Dialog>
  );
}
