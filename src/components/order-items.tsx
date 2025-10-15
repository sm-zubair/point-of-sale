import { order_details } from '@prisma/client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useMemo } from 'react';
import store from '../store';

type Props = {
  items: order_details[];
  scrollHeight?: string;
  allowItemRemove?: boolean;
};

export default function OrderItems({ items = [], scrollHeight = '600px', allowItemRemove = false }: Props) {
  const _items = useMemo(() => {
    return items.sort((a, b) => a.category.localeCompare(b.category));
  }, [items]);

  return (
    <>
      <DataTable
        value={_items}
        size="small"
        showGridlines
        pt={{ wrapper: { style: { height: scrollHeight, backgroundColor: 'white' } } }}
        scrollHeight={scrollHeight}
      >
        <Column field="name" header="Name" />
        <Column field="category" header="Category" style={{ width: '180px' }} />
        <Column field="quantity" header="Quantity" align="center" style={{ textAlign: 'center', width: '100px' }} />
        <Column field="originalPrice" header="Price" align="center" style={{ textAlign: 'center', width: '100px' }} />
        <Column
          field="discount"
          header="Discount"
          style={{ width: '100px' }}
          align="center"
          body={(data) => data.originalPrice - data.price}
        />
        <Column
          field="totalAmount"
          header="Total"
          align="center"
          style={{ textAlign: 'center', width: '100px' }}
          body={(data) => Math.floor(data.totalAmount)}
        />
        {allowItemRemove && (
          <Column
            field="action"
            header="Action"
            align="center"
            style={{ textAlign: 'center', width: '10%' }}
            body={(data, opt) => (
              <div className="flex items-center justify-center gap-2">
                <Button
                  icon="pi pi-times"
                  severity="danger"
                  className="p-1"
                  onClick={() => {
                    const order = store.getState().order;
                    const newItems = [...order?.items];
                    newItems.splice(opt.rowIndex, 1);
                    store.setState({
                      order: {
                        ...order,
                        items: newItems,
                      },
                    });
                  }}
                />
              </div>
            )}
          />
        )}
      </DataTable>
    </>
  );
}
