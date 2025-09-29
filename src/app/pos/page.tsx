'use client';
import type {
  categories as Category,
  discounts as Discount,
  items as Item,
  ledger as Ledger,
  orders as Order,
  shifts as Shift,
  staff as Staff,
} from '@prisma/client';
import { useFormik } from 'formik';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Chip } from 'primereact/chip';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as Yup from 'yup';
import {
  createLedger,
  createOrder,
  createOrderDelete,
  getAccounts,
  getCategories,
  getDiscounts,
  getItems,
  getLedger,
  getOrders,
  getShift,
  getStaff,
  getUniqueCustomers,
  removeOrder,
  removeOrderDetails,
  updateOrder,
} from '../../actions';
import OrderStatus from '../../constants/order-status';
import OrderType from '../../constants/order-type';
import notify from '../../helpers/notify';
import uuid from '../../helpers/uuid';

export default function POS() {
  const router = useRouter();
  const [waiters, setWaiters] = useState<Staff[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [appliedDiscounts, setAppliedDiscounts] = useState<Discount[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online' | null>(null);
  const [currentShift, setCurrentShift] = useState<Shift>(null);
  const [customers, setCustomers] = useState<string[]>([]);
  const [accounts, setAccounts] = useState([]);
  const [selectCustomer, setSelectCustomer] = useState<boolean>(false);
  const [cashOut, setCashOut] = useState<boolean>(false);
  const [ledgerRecords, setLedgerRecords] = useState<Ledger[]>([]);
  const tableRef = useRef(null);

  const order = useFormik({
    initialValues: {
      id: null,
      orderNumber: null,
      isNew: false,
      isEdit: false,
      type: OrderType.DineIn,
      total: 0,
      discountValue: 0,
      net: 0,
      commission: 0,
      status: OrderStatus.Pending,
      itemLess: [],
      items: [],
      discounts: [],
      waiter: null,
      categoryId: null,
      subCategoryId: null,
      payment: null,
      createdAt: null,
      updatedAt: null,
      tip: 0,
      shiftId: null,
      deleteReason: null,
      received: 0,
      customer: null,
    },
    onSubmit: async (values) => {
      try {
        const total = values.items.reduce((t, item) => t + item.originalPrice * item.quantity, 0);
        const net = values.items.reduce((t, item) => t + item.totalAmount, 0);
        const discount = total - net;
        const items = values.items;
        if (values.isNew) {
          const now = new Date();
          const item = await createOrder({
            data: {
              id: uuid(),
              orderNumber: `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`,
              type: values.type,
              status: values.status,
              waiter: values.waiter,
              payment: values.payment,
              commission: values.commission,
              total,
              discountValue: Math.ceil(discount),
              net,
              shiftId: currentShift.id,
              discounts: values.discounts,
              items: {
                create: items,
              },
              customer: values.customer,
            },
            include: { items: { omit: { orderId: true } } },
          });
          notify('success', 'Order added', 'Success');
          setOrders([...orders, item]);
        } else {
          const item = await updateOrder({
            where: { id: values.id },
            data: {
              total,
              discountValue: discount,
              net,
              discounts: values.discounts,
              items: { deleteMany: {}, create: items },
              customer: values.customer,
              type: values.type,
            },
            include: { items: { omit: { orderId: true } } },
          });
          if (item) {
            const newOrders = orders.filter((order) => order.id !== values.id);
            setOrders([...newOrders, item]);
            notify('success', 'Order updated', 'Success');
          } else {
            notify('error', 'Error', 'Failed to update order');
          }
        }
        handleOrderReset();
        order.setFieldValue('type', values.type);
      } catch (e: any) {
        notify('error', 'Error', e.message);
      }
    },
  });

  const cashOutForm = useFormik({
    initialValues: {
      account: null,
      amount: 0,
      description: '',
    },
    validationSchema: Yup.object({
      account: Yup.string().required(),
      amount: Yup.number().required(),
      description: Yup.string().required(),
    }),
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      try {
        const entries = convertDescriptionToEntries(values.description, 'credit');
        const totalCredit = entries.reduce((t, e) => t + e.credit, 0);
        if (totalCredit !== Number(values.amount)) {
          notify('error', 'Error', 'Amount does not match');
          return;
        }
        const data: Ledger[] = entries.map((x) => ({
          id: uuid(),
          account: values.account,
          date: currentShift.openAt,
          description: x.description,
          credit: x.credit,
          debit: 0,
          shiftId: currentShift.id,
        }));
        if (!data.length) {
          notify('error', 'Error', 'No entries found');
          return;
        }
        const ledger = await createLedger({ data });
        if (ledger.count > 0) {
          setLedgerRecords([...ledgerRecords, ...data]);
          cashOutForm.resetForm();
          notify('success', 'Cash out added', 'Success');
        }
      } catch (e: any) {
        notify('error', 'Error', e.message);
      }
    },
  });

  const { category, subCategory, selectedCategoryId, selectedCategory } = useMemo(() => {
    const selectedCategoryId = order.values.subCategoryId || order.values.categoryId;
    return {
      category: categories.find((c) => c.id === order.values.categoryId)?.name,
      subCategory: categories.find((c) => c.id === order.values.subCategoryId)?.name,
      selectedCategory: categories.find((c) => c.id === selectedCategoryId)?.name,
      selectedCategoryId,
    };
  }, [order.values.categoryId, order.values.subCategoryId]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => o.type === order.values.type);
  }, [orders, order.values.type]);

  const { countDineIn, countTakeAway, countDelivery, countCredit } = useMemo(() => {
    let countDineIn = 0;
    let countTakeAway = 0;
    let countDelivery = 0;
    let countCredit = 0;
    orders.forEach((o) => {
      if (o.type === OrderType.DineIn) countDineIn++;
      else if (o.type === OrderType.TakeAway) countTakeAway++;
      else if (o.type === OrderType.Delivery) countDelivery++;
      else if (o.type === OrderType.Credit) countCredit++;
    });
    return { countDineIn, countTakeAway, countDelivery, countCredit };
  }, [orders]);

  const returnAmount = useMemo(() => {
    return (order.values.received || 0) - order.values.net;
  }, [order.values.received, order.values.net, order.values.discountValue]);

  const handleAddItem = async (item: Item) => {
    let originalPrice = categories.find((c) => c.id === selectedCategoryId && c.price > 0)?.price || item.price;
    //category factored price
    const factored = categories.find((c) => c.id === selectedCategoryId && c.factor > 0);
    if (factored) {
      originalPrice *= factored.factor;
    }
    let discountedPrice = originalPrice;
    let discount = appliedDiscounts.find((d) => !(d.items as string[])?.length && !(d.categories as string[])?.length);
    if (discount) {
      //flat discount
      discountedPrice *= 1 - discount.value / 100;
    } else {
      //item discount
      discount = appliedDiscounts.find(
        (d) => (d.items as string[])?.includes(item.id) || (d.categories as string[])?.includes(selectedCategoryId)
      );
      if (discount) {
        discountedPrice *= 1 - discount.value / 100;
      }
    }
    if (!order.values.discounts.some((d) => d.id === discount.id) && discount) {
      order.setFieldValue('discounts', [
        ...order.values.discounts,
        { id: discount.id, value: discount.value, name: discount.name },
      ]);
    }
    const newItems = order.values.items.map((existingItem) => {
      if (existingItem.itemId === item.id && selectedCategory === existingItem.category) {
        return {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          totalAmount: existingItem.totalAmount + discountedPrice,
        };
      }
      return existingItem;
    });
    const itemExists = newItems.some((i) => i.itemId === item.id && selectedCategory === i.category);
    if (!itemExists) {
      newItems.push({
        itemId: item.id,
        name: item.name,
        price: Math.floor(discountedPrice),
        quantity: 1,
        totalAmount: Math.floor(discountedPrice),
        originalPrice: Math.floor(originalPrice),
        category: selectedCategory,
        categoryId: order.values.subCategoryId || order.values.categoryId,
      });
    }
    order.setFieldValue('items', newItems);
  };

  const handleDeleteOrder = async () => {
    const deleted = await removeOrder({
      where: { id: order.values.id },
    });
    if (deleted) {
      await removeOrderDetails({
        where: { orderId: order.values.id },
      });
      await createOrderDelete({
        data: {
          id: uuid(),
          orderNumber: order.values.orderNumber,
          type: order.values.type,
          status: OrderStatus.Deleted,
          reason: order.values.deleteReason,
          total: order.values.total,
          discount: order.values.discountValue,
          commission: order.values.commission,
          net: order.values.net,
          items: order.values.items,
          waiter: order.values.waiter,
          payment: order.values.payment,
        },
      });
      const _orders = orders.filter((o) => o.id !== order.values.id);
      setOrders(_orders);
      notify('success', 'Order deleted', 'Success');
      setDeleteConfirm(false);
      handleOrderReset();
    } else {
      notify('error', 'Error', 'Failed to delete order');
    }
  };

  const handlePayment = async (method: 'cash' | 'card' | 'online') => {
    let status, tip;
    switch (method) {
      case 'cash': {
        status = OrderStatus.Paid;
        break;
      }
      case 'card': {
        status = OrderStatus.Paid;
        tip = returnAmount;
        break;
      }
      case 'online': {
        status = OrderStatus.Paid;
        tip = returnAmount;
        break;
      }
      default: {
        status = OrderStatus.Pending;
        break;
      }
    }
    const updated = await updateOrder({
      where: { id: order.values.id },
      data: { status, payment: method, tip },
    });
    if (updated) {
      const _orders = orders.filter((o) => o.id !== order.values.id);
      setOrders(_orders);
      notify('success', 'Order paid', 'Success', true);
      setPaymentMethod(null);
      handleOrderReset();
    } else {
      notify('error', 'Error', 'Failed to pay order');
    }
  };

  const handleOrderReset = () => {
    order.resetForm({
      values: {
        ...order.initialValues,
        type: order.values.type,
      },
    });
  };

  const handleApplyDiscount = (applyDiscount: Discount, apply: boolean) => {
    //check if order is selected
    if (order.values.id) {
      let _appliedDiscounts = discounts.filter((x) => order.values.discounts.some((d) => d.id === x.id)) as Discount[];
      if (apply) {
        _appliedDiscounts.push(applyDiscount);
      } else {
        _appliedDiscounts = _appliedDiscounts.filter((d) => d.id !== applyDiscount.id);
      }
      const confirmation = window.confirm('Are you sure you want change discounts ?');
      if (true) {
        let grossTotal = 0;
        let discountedTotal = 0;
        const newItems = order.values.items.map((item) => {
          let discountedPrice = item.originalPrice;
          let discount = _appliedDiscounts.find(
            (d) => !(d.items as string[])?.length && !(d.categories as string[])?.length
          );
          if (discount) {
            discountedPrice *= 1 - discount.value / 100;
          } else {
            discount = _appliedDiscounts.find(
              (d) =>
                (d.items as string[])?.includes(item.itemId) || (d.categories as string[])?.includes(item.categoryId)
            );
            if (discount) {
              discountedPrice *= 1 - discount.value / 100;
            }
          }
          grossTotal += item.originalPrice * item.quantity;
          discountedTotal += discountedPrice * item.quantity;
          return {
            ...item,
            price: discountedPrice,
            totalAmount: discountedPrice * item.quantity,
          };
        });
        updateOrder({
          where: { id: order.values.id },
          data: {
            total: grossTotal,
            discountValue: grossTotal - discountedTotal,
            net: discountedTotal,
            discounts: _appliedDiscounts,
            items: {
              deleteMany: {},
              create: newItems,
            },
          },
          include: { items: { omit: { orderId: true } } },
        })
          .then((updated) => {
            if (updated) {
              //refresh orders
              const newOrders = orders.filter((o) => o.id !== order.values.id);
              newOrders.push(updated);
              setOrders(newOrders.sort((a, b) => (a.orderNumber > b.orderNumber ? 1 : -1)));
              notify('success', 'Order updated', 'Success');
              handleOrderReset();
            } else {
              notify('error', 'Error', 'Failed to update order');
            }
          })
          .catch((e) => {
            notify('error', 'Error', e.message);
          });
      } else {
        handleOrderReset();
      }
    } else {
      if (apply) {
        setAppliedDiscounts([...appliedDiscounts, applyDiscount]);
      } else {
        setAppliedDiscounts(appliedDiscounts.filter((d) => d.id !== applyDiscount.id));
      }
    }
  };

  const handleOrderMove = () => {
    if (order.values.id) {
      const confirmMove = confirm('Are you sure you want to move this order?');
      if (confirmMove) {
        if (!order.values.customer) setSelectCustomer(true);
      }
    }
  };

  const convertDescriptionToEntries = (description: string, type: 'debit' | 'credit') => {
    const rows = description.split('\n');
    const entries = [];
    for (const row of rows) {
      if (!row) continue;
      if (!row.includes('=')) continue;
      const [desc, amount] = row.split('=');
      entries.push({
        description: desc.trim(),
        debit: type === 'debit' ? Number(amount.trim()) : null,
        credit: type === 'credit' ? Number(amount.trim()) : null,
      });
    }
    return entries;
  };

  //visual feedback
  useEffect(() => {
    const table = tableRef.current;
    if (!table) {
      return;
    } else {
      console.log('tableRef', tableRef);
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          // Row added
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeName === 'TR') {
                (node as HTMLElement).classList.add('highlight');
                setTimeout(() => (node as HTMLElement).classList.remove('highlight'), 500);
              }
            });
          }
          // Cell data changed
          if (mutation.type === 'characterData') {
            const cell = (mutation.target as CharacterData).parentElement;
            if (cell) {
              cell.classList.add('highlight');
              setTimeout(() => cell.classList.remove('highlight'), 500);
            }
          }
        }
      });
      observer.observe(table, {
        childList: true,
        characterData: true,
        subtree: true,
      });
      return () => observer.disconnect(); // cleanup on unmount
    }
  }, [tableRef.current]);

  useEffect(() => {
    (async () => {
      const currentShift = await getShift({
        where: {
          closeAt: null,
        },
      });
      if (currentShift) {
        setCurrentShift(currentShift);
        const staff = await getStaff({
          select: { id: true, name: true, commission: true },
          orderBy: { name: 'asc' },
        });
        const categories = await getCategories({ orderBy: { order: 'asc' } });
        const items = await getItems({
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
        });
        const orders = await getOrders({
          where: { shiftId: currentShift.id, status: { not: { in: [OrderStatus.Paid, OrderStatus.Due] } } },
          include: { items: { omit: { orderId: true } } },
          orderBy: { createdAt: 'asc' },
        });
        const discounts = await getDiscounts({
          select: {
            id: true,
            name: true,
            value: true,
            autoApply: true,
            items: true,
            categories: true,
          },
          where: {
            isActive: true,
          },
          orderBy: { name: 'asc' },
        });
        const customers = await getUniqueCustomers();
        const accounts = await getAccounts({
          orderBy: {
            name: 'asc',
          },
        });
        const ledgerRecords = await getLedger({
          where: {
            date: {
              gte: currentShift.openAt,
            },
          },
        });

        const _accounts = [...accounts, ...staff]
          .map((a) => ({
            id: a.id,
            name: a.name,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setWaiters(staff.filter((s) => s.isServing));
        setCategories(categories);
        setItems(items);
        setOrders(orders);
        setDiscounts(discounts);
        setAppliedDiscounts(discounts.filter((d) => d.autoApply));
        setCustomers(customers.map((c) => c.customer));
        setAccounts(_accounts);
        setLedgerRecords(ledgerRecords);
      } else {
        setCurrentShift(null);
      }
    })();
  }, []);

  if (!currentShift) {
    return (
      <>
        <div className="flex flex-col items-center justify-center">
          <h1 className="mb-4 text-2xl font-bold">Please open a shift first</h1>
          <Button label="Home" icon="pi pi-home" onClick={() => router.push('/')} className="min-w-24 p-5" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button label="Home" icon="pi pi-home" onClick={() => router.push('/')} className="min-w-24 p-5" />
        <Button
          label="Dine In"
          icon="pi pi-list"
          severity="success"
          badge={countDineIn.toString()}
          onClick={() => order.setFieldValue('type', OrderType.DineIn)}
          disabled={order.values.type === OrderType.DineIn || order.values.isNew}
          className="min-w-24 p-5"
        />
        <Button
          label="Take Away"
          icon="pi pi-shopping-bag"
          severity="secondary"
          badge={countTakeAway.toString()}
          onClick={() => order.setFieldValue('type', OrderType.TakeAway)}
          disabled={order.values.type === OrderType.TakeAway || order.values.isNew}
          className="min-w-24 p-5"
        />
        <Button
          label="Credit"
          icon="pi pi-credit-card"
          severity="secondary"
          badge={countCredit.toString()}
          onClick={() => {
            order.setFieldValue('type', OrderType.Credit);
            handleOrderMove();
          }}
          disabled={order.values.type === OrderType.Credit || order.values.isNew}
          className="min-w-24 p-5"
        />
        <Divider layout="vertical" />
        <div className="flex grow justify-center gap-2">
          <Button
            label="Cash Out"
            icon="pi pi-minus"
            severity="info"
            onClick={() => setCashOut(true)}
            className="min-w-24 p-5"
          />
          <Button label="Cash In" icon="pi pi-plus" severity="info" className="min-w-24 p-5" />
          <Button label="Inventory" icon="pi pi-box" severity="info" className="min-w-24 p-5" />
          <Button label="Sale Return" icon="pi pi-refresh" severity="danger" className="min-w-24 p-5" />
        </div>
      </div>
      {!order.values.isNew && !order.values.isEdit ? (
        <div className="grid grid-cols-12">
          <div className="col-span-5">
            <DataTable
              dataKey="id"
              size="small"
              value={filteredOrders}
              selection={order.values}
              selectionMode="single"
              scrollHeight="600px"
              rowGroupMode="subheader"
              groupRowsBy={order.values.type === OrderType.DineIn ? 'waiter' : 'customer'}
              sortField="waiter"
              columnResizeMode="expand"
              className="compact-table"
              pt={{ wrapper: { style: { height: '600px', backgroundColor: 'white' } } }}
              showGridlines
              onSelectionChange={(e) => {
                if (e.value) {
                  order.setValues(e.value);
                } else {
                  handleOrderReset();
                }
              }}
              rowGroupHeaderTemplate={(data: Order) => (
                <div className="-mx-1.5 -my-[5px] bg-[lightgrey] p-0! text-center font-bold">
                  {data.waiter || data.customer}
                </div>
              )}
            >
              <Column
                header="Order"
                field="orderNumber"
                align="center"
                style={{ width: '80px', textAlign: 'center' }}
              />
              <Column
                header="Time"
                field="createdAt"
                align="center"
                body={(data: Order) =>
                  data.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                }
                style={{ width: '100px', textAlign: 'center' }}
              />
              {order.values.type === OrderType.DineIn && <Column header="Waiter" field="waiter" />}
              {order.values.type === OrderType.Credit && <Column header="Customer" field="customer" />}
              <Column header="Status" field="status" align="center" style={{ width: '80px', textAlign: 'center' }} />
              <Column
                header="Total"
                field="net"
                align="center"
                style={{ width: '150px', textAlign: 'center' }}
                body={(data: Order) => data.net.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              />
            </DataTable>
          </div>
          <div className="col-span-1">
            <div className="flex flex-col items-center gap-2">
              <Button
                label="New"
                icon="pi pi-plus"
                severity="info"
                onClick={() => {
                  order.setFieldValue('isNew', true);
                  if (order.values.type === OrderType.Credit) setSelectCustomer(true);
                }}
                className="min-w-28 p-4"
              />
              <Divider className="my-2" />
              <Button
                label="Close"
                icon="pi pi-times"
                severity="secondary"
                disabled={!order.values.id}
                onClick={() => handleOrderReset()}
                className="min-w-28 p-4"
              />
              <Button
                label="Edit"
                icon="pi pi-pencil"
                severity="secondary"
                disabled={!order.values.id}
                onClick={() => order.setFieldValue('isEdit', true)}
                className="min-w-28 p-4"
              />
              <Button
                label="Delete"
                icon="pi pi-times"
                severity="danger"
                disabled={!order.values.id}
                onClick={() => {
                  setDeleteConfirm(true);
                }}
                className="min-w-28 p-4"
              />
              <Divider className="my-2" />
              <Button
                label="Bill"
                icon="pi pi-file"
                disabled={!order.values.id}
                className="min-w-28 p-4"
                onClick={() => {
                  router.push(`/bill/${order.values.orderNumber}`);
                  // const win = window.open(
                  //   `/bill/${order.values.orderNumber}`,
                  //   '_blank',
                  //   'width=400,height=600,toolbar=no,menubar=no,scrollbars=yes,location=no,directories=no,status=no,left=200,top=150'
                  // );
                  // win?.print();
                  // win.close();
                }}
              />
              <Divider className="my-2" />
              <Button
                label="Cash"
                icon="pi pi-money-bill"
                severity="success"
                onClick={() => {
                  setPaymentMethod('cash');
                  order.setFieldValue('payment', 'cash');
                }}
                disabled={!order.values.id}
                className="min-w-28 p-4"
              />
              <Button
                label="Card"
                icon="pi pi-credit-card"
                severity="warning"
                onClick={() => {
                  setPaymentMethod('card');
                  order.setFieldValue('payment', 'card');
                  order.setFieldValue('received', order.values.net);
                }}
                disabled={!order.values.id}
                className="min-w-28 p-4"
              />
              <Button
                label="Online"
                icon="pi pi-qrcode"
                severity="warning"
                onClick={() => {
                  setPaymentMethod('online');
                  order.setFieldValue('payment', 'online');
                  order.setFieldValue('received', order.values.net);
                }}
                disabled={!order.values.id}
                className="min-w-28 p-4"
              />
            </div>
          </div>
          <div className="col-span-6 bg-white">
            <DataTable
              value={order.values.items}
              size="small"
              showGridlines
              scrollHeight="400px"
              pt={{ wrapper: { style: { height: '400px', backgroundColor: 'white' } } }}
            >
              <Column field="name" header="Name" />
              <Column field="category" header="Category" style={{ width: '180px' }} />
              <Column
                field="quantity"
                header="Quantity"
                align="center"
                style={{ textAlign: 'center', width: '100px' }}
              />
              <Column
                field="originalPrice"
                header="Price"
                align="center"
                style={{ textAlign: 'center', width: '100px' }}
              />
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
              />
            </DataTable>
            <div className="w-full border-0 border-t p-4">
              <div className="flex items-center justify-between text-lg">
                <div>
                  Order : <b>{order.values.orderNumber}</b>
                </div>
                <div>
                  Waiter : <b>{order.values.waiter}</b>
                </div>
                <div>
                  Discount :&nbsp;
                  <b>
                    {(order.values.total - order.values.net).toLocaleString('en-US', {
                      maximumFractionDigits: 0,
                    })}
                  </b>
                </div>
                <div>
                  Total : <b>{order.values.net.toLocaleString('en-US', { maximumFractionDigits: 0 })}</b>
                </div>
              </div>
              <Divider />
              <div className="flex flex-wrap items-center gap-3">
                <h4 className="m-0">Discounts :</h4>
                {discounts.map((dis) => (
                  <div key={dis.id} className="flex items-center">
                    <Checkbox
                      inputId={dis.id}
                      name={dis.name}
                      value={dis.id}
                      checked={
                        order.values.id
                          ? order.values.discounts?.some((d) => d.id === dis.id)
                          : appliedDiscounts.some((d) => d.id === dis.id)
                      }
                      onChange={(e) => handleApplyDiscount(dis, e.checked)}
                    />
                    <label htmlFor={dis.id} className="ml-2 cursor-pointer font-semibold">
                      {dis.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Waiter selection */}
          {!order.values.waiter && order.values.isNew && order.values.type === OrderType.DineIn ? (
            <div className="flex flex-wrap gap-2">
              <Button
                label="Close"
                icon="pi pi-times"
                onClick={() => handleOrderReset()}
                severity="secondary"
                className="pos-button"
              />
              {waiters.map((waiter) => (
                <Button
                  key={waiter.id}
                  label={waiter.name}
                  onClick={() => {
                    order.setFieldValue('waiter', waiter.name);
                    order.setFieldValue('commission', waiter.commission);
                  }}
                  className="pos-button"
                />
              ))}
            </div>
          ) : (
            <>
              {/* items selection */}
              <div className="grid grid-cols-12">
                <div className="col-span-5">
                  <div className="flex flex-wrap gap-2">
                    {order.values.categoryId && <Chip label={category} className="mb-2" />}
                    {order.values.subCategoryId && <Chip label={subCategory} className="mb-2" />}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Category selection */}
                    {!order.values.categoryId &&
                      categories.map((c) => {
                        return (
                          (c.parents as string[]).length === 0 && (
                            <Button
                              key={c.id}
                              label={c.name}
                              className="pos-button"
                              onClick={() => order.setFieldValue('categoryId', c.id)}
                            />
                          )
                        );
                      })}
                    {/* Sub Category selection */}
                    {order.values.categoryId && !order.values.subCategoryId && (
                      <>
                        <Button
                          label="Back"
                          icon="pi pi-arrow-left"
                          onClick={() => order.setFieldValue('categoryId', null)}
                          severity="secondary"
                          className="pos-button"
                        />
                        {categories.map((c) => {
                          return (
                            (c.parents as string[]).includes(order.values.categoryId) && (
                              <Button
                                key={c.id}
                                label={c.name}
                                className="pos-button"
                                onClick={() => order.setFieldValue('subCategoryId', c.id)}
                                severity="info"
                              />
                            )
                          );
                        })}
                        {items.map((i) => {
                          return (
                            (i.categories as string[]).includes(order.values.categoryId) && (
                              <Button
                                key={i.id}
                                label={i.name}
                                className="pos-button"
                                onClick={() => {
                                  handleAddItem(i);
                                }}
                                severity="help"
                              />
                            )
                          );
                        })}
                      </>
                    )}
                    {/* Items selections */}
                    {order.values.subCategoryId && (
                      <>
                        <Button
                          label="Back"
                          icon="pi pi-arrow-left"
                          onClick={() => order.setFieldValue('subCategoryId', null)}
                          severity="secondary"
                          className="pos-button"
                        />
                        {items.map((i) => {
                          return (
                            (i.categories as string[]).includes(order.values.subCategoryId) && (
                              <Button
                                key={i.id}
                                label={i.name}
                                className="pos-button"
                                onClick={() => {
                                  handleAddItem(i);
                                }}
                                severity="help"
                              />
                            )
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Button
                      label="Done"
                      icon="pi pi-check"
                      onClick={() => order.submitForm()}
                      severity="success"
                      className="min-w-28 p-5"
                    />
                    <Divider />
                    <Button
                      label="Close"
                      icon="pi pi-times"
                      severity="secondary"
                      onClick={() => handleOrderReset()}
                      className="min-w-28 p-5"
                    />
                  </div>
                </div>
                <div className="col-span-6" ref={tableRef}>
                  <DataTable value={order.values.items} size="small" showGridlines>
                    <Column field="name" header="Name" />
                    <Column field="category" header="Category" />
                    <Column field="quantity" header="Quantity" className="text-center font-bold" align="center" />
                    <Column field="price" header="Price" className="text-center font-bold" align="center" />
                    <Column
                      field="totalAmount"
                      header="Total"
                      className="text-center font-bold"
                      align="center"
                      body={(d) => Math.floor(d.totalAmount)}
                    />
                    {/* <Column
                      field="action"
                      header="Action"
                      align="center"
                      body={(data) => (
                        <>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              icon="pi pi-times"
                              severity="danger"
                              className="p-1"
                              onClick={() => {

                                console.log(data);
                              }}
                            />
                          </div>
                        </>
                      )}
                    /> */}
                  </DataTable>
                </div>
              </div>
            </>
          )}
        </>
      )}
      {deleteConfirm && (
        <Dialog
          header="Enter a reason for removing this order"
          visible={true}
          resizable={false}
          draggable={false}
          onHide={() => {
            setDeleteConfirm(false);
            handleOrderReset();
          }}
          pt={{
            footer: {
              className: 'p-0',
            },
          }}
          footer={() => (
            <div className="flex items-center justify-between border-0 border-t border-[lightgrey] p-4">
              <Button
                label="Cancel"
                onClick={() => {
                  setDeleteConfirm(false);
                  handleOrderReset();
                }}
                severity="secondary"
              />
              <Button
                label="Done"
                disabled={!order.values.deleteReason}
                onClick={() => handleDeleteOrder()}
                severity="success"
              />
            </div>
          )}
        >
          <div className="grid grid-cols-3 gap-4">
            <Button label="Mistake" outlined onClick={() => order.setFieldValue('deleteReason', 'By mistake')} />
            <Button
              label="Customer Request"
              outlined
              onClick={() => order.setFieldValue('deleteReason', 'Customer request')}
            />
            <Button
              label="Complain"
              severity="danger"
              outlined
              onClick={() => order.setFieldValue('deleteReason', 'Complain: ')}
            />
            <InputTextarea
              rows={4}
              className="col-span-3"
              value={order.values.deleteReason || ''}
              onChange={(e) => order.setFieldValue('deleteReason', e.target.value)}
            />
          </div>
        </Dialog>
      )}
      {/* CASH PAYMENT */}
      {paymentMethod === 'cash' && (
        <Dialog
          header={`Cash # ${order.values.orderNumber}`}
          visible={true}
          resizable={false}
          draggable={false}
          onHide={() => {
            setPaymentMethod(null);
            handleOrderReset();
          }}
          pt={{
            footer: {
              className: 'p-0',
            },
          }}
          footer={() => (
            <div className="flex items-center justify-between gap-4 border-0 border-t border-[lightgrey] p-4">
              <Button
                label="Cancel"
                onClick={() => {
                  setPaymentMethod(null);
                  handleOrderReset();
                }}
                severity="secondary"
              />
              <Button
                label="Done"
                disabled={!order.values.received || returnAmount < 0}
                onClick={() => handlePayment('cash')}
                severity="success"
              />
            </div>
          )}
        >
          <div className="grid grid-cols-12 gap-4 p-2">
            <div className="col-span-5 flex items-center">
              <div className="grid w-full grid-cols-2 gap-5">
                <Button
                  label="Rs. 10"
                  outlined
                  onClick={() => order.setFieldValue('received', Number(order.values.received ?? 0) + 10)}
                />
                <Button
                  label="Rs. 50"
                  outlined
                  onClick={() => order.setFieldValue('received', Number(order.values.received ?? 0) + 50)}
                />
                <Button
                  label="Rs. 100"
                  outlined
                  onClick={() => order.setFieldValue('received', Number(order.values.received ?? 0) + 100)}
                />
                <Button
                  label="Rs. 200"
                  outlined
                  onClick={() => order.setFieldValue('received', Number(order.values.received ?? 0) + 200)}
                />
                <Button
                  label="Rs. 500"
                  outlined
                  onClick={() => order.setFieldValue('received', Number(order.values.received ?? 0) + 500)}
                />
                <Button
                  label="Rs. 1000"
                  outlined
                  onClick={() => order.setFieldValue('received', Number(order.values.received ?? 0) + 1000)}
                />
                <Button
                  label="Rs. 5000"
                  outlined
                  onClick={() => order.setFieldValue('received', Number(order.values.received ?? 0) + 5000)}
                />
                <Button
                  label="Clear"
                  severity="danger"
                  icon="pi pi-delete-left"
                  outlined
                  onClick={() => order.setFieldValue('received', null)}
                />
              </div>
            </div>
            <Divider layout="vertical" className="col-span-1" />
            <div className="col-span-6 p-2">
              <div className="flex items-center justify-between p-2">
                <div className="text-lg font-bold">Total:</div>
                <div className="w-1/2 px-2 font-bold">
                  Rs. {order.values.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="flex items-center justify-between p-2">
                <div className="text-lg font-bold">Discount:</div>
                <div className="w-1/2 px-2 font-bold">
                  (Rs. {order.values.discountValue.toLocaleString('en-US', { maximumFractionDigits: 0 })})
                </div>
              </div>
              <div className="flex items-center justify-between p-2">
                <div className="text-lg font-bold">Bill:</div>
                <div className="w-1/2 px-2 font-bold">
                  Rs. {order.values.net.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <Divider />
              <div className="flex items-center justify-between p-2">
                <div className="text-lg font-bold">Received:</div>
                <InputText
                  value={order.values.received?.toString() || ''}
                  onChange={(e) => order.setFieldValue('received', Number(e.target.value))}
                  inputMode="numeric"
                  className="w-1/2 font-semibold"
                  type="number"
                />
              </div>
              {!order.values.discounts?.length && (
                <div className="flex items-center justify-between p-2">
                  <div className="text-lg font-bold">Discount:</div>
                  <InputText
                    value={order.values.discountValue?.toString() || ''}
                    onChange={(e) => {
                      order.setFieldValue('discountValue', Number(e.target.value));
                      order.setFieldValue('net', Number(order.values.total) - Number(e.target.value));
                    }}
                    inputMode="numeric"
                    className="w-1/2 font-semibold"
                    type="number"
                  />
                </div>
              )}
              <div className="flex items-center justify-between p-2">
                <div className="text-lg font-bold">Return:</div>
                {returnAmount > 0 && (
                  <div className="w-1/2 px-2 font-bold text-green-950">
                    Rs. {returnAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      )}
      {(paymentMethod === 'card' || paymentMethod === 'online') && (
        <Dialog
          header={`${paymentMethod === 'card' ? 'Card' : 'Online'} # ${order.values.orderNumber}`}
          visible={true}
          resizable={false}
          draggable={false}
          onHide={() => {
            setPaymentMethod(null);
            handleOrderReset();
          }}
          pt={{
            footer: {
              className: 'p-0',
            },
          }}
          footer={() => (
            <div className="flex items-center justify-between gap-4 border-0 border-t border-[lightgrey] p-4">
              <Button
                label="Cancel"
                onClick={() => {
                  setPaymentMethod(null);
                  handleOrderReset();
                }}
                severity="secondary"
              />
              <Button
                label="Done"
                disabled={!order.values.received || returnAmount < 0}
                onClick={() => handlePayment(paymentMethod)}
                severity="success"
              />
            </div>
          )}
        >
          <div className="p-2">
            <div className="flex items-center justify-between p-2">
              <div className="text-lg font-bold">Total:</div>
              <div className="w-1/2 px-2 font-bold">
                Rs. {order.values.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="flex items-center justify-between p-2">
              <div className="text-lg font-bold">Discount:</div>
              <div className="w-1/2 px-2 font-bold">
                (Rs. {order.values.discountValue.toLocaleString('en-US', { maximumFractionDigits: 0 })})
              </div>
            </div>
            <div className="flex items-center justify-between p-2">
              <div className="text-lg font-bold">Bill:</div>
              <div className="w-1/2 px-2 font-bold">
                Rs. {order.values.net.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <Divider />
            <div className="flex items-center justify-between p-2">
              <div className="text-lg font-bold">Received:</div>
              <InputText
                value={order.values.received?.toString() || ''}
                onChange={(e) => order.setFieldValue('received', Number(e.target.value))}
                inputMode="numeric"
                className="w-1/2 font-semibold"
                type="number"
              />
            </div>
            <div className="flex items-center justify-between p-2">
              <div className="text-lg font-bold">Tip:</div>
              {returnAmount > 0 && (
                <div className="w-1/2 px-2 font-bold text-green-950">
                  Rs. {returnAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}
      {selectCustomer && (
        <Dialog
          header={`Credit # ${order.values.orderNumber}`}
          visible={true}
          resizable={false}
          draggable={false}
          onHide={() => {
            setSelectCustomer(false);
            handleOrderReset();
          }}
          pt={{
            footer: {
              className: 'p-0',
            },
          }}
          footer={() => (
            <div className="flex items-center justify-between gap-4 border-0 border-t border-[lightgrey] p-4">
              <Button
                label="Cancel"
                onClick={() => {
                  setSelectCustomer(false);
                  handleOrderReset();
                }}
                severity="secondary"
              />
              <Button
                label="Done"
                disabled={!order.values.customer}
                onClick={() => {
                  if (order.values.id) order.submitForm();
                  setSelectCustomer(false);
                }}
                severity="success"
              />
            </div>
          )}
        >
          <div className="p-2">
            <div className="flex items-center justify-between gap-4 p-2">
              <div className="text-lg font-bold">Customer:</div>
              <InputText
                value={order.values.customer || ''}
                onChange={(e) => order.setFieldValue('customer', e.target.value)}
                className="font-semibold"
              />
            </div>
          </div>
        </Dialog>
      )}
      <Dialog
        header={`Cash Out`}
        visible={cashOut}
        resizable={false}
        draggable={false}
        onHide={() => {
          setCashOut(false);
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
                setCashOut(false);
              }}
              severity="secondary"
            />
            <Button
              label="Done"
              onClick={() => {
                cashOutForm.submitForm();
                // setCashOut(false);
              }}
              severity="success"
            />
          </div>
        )}
      >
        <div className="p-2">
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2 flex flex-col gap-4">
              <Dropdown
                options={accounts}
                placeholder="Account"
                optionLabel="name"
                optionValue="name"
                invalid={cashOutForm.errors.account ? true : false}
                {...cashOutForm.getFieldProps('account')}
              />
              <InputText
                inputMode="numeric"
                name="amount"
                className="w-full"
                placeholder="Amount"
                invalid={cashOutForm.errors.amount ? true : false}
                {...cashOutForm.getFieldProps('amount')}
              />
              <InputTextarea
                rows={10}
                className="w-full"
                placeholder="Break up..."
                invalid={cashOutForm.errors.description ? true : false}
                {...cashOutForm.getFieldProps('description')}
              />
            </div>
            <div className="col-span-3">
              <DataTable
                value={ledgerRecords}
                className="compact-table border border-solid border-[lightgrey]"
                stripedRows
              >
                <Column
                  header="#"
                  field="sn"
                  align="center"
                  style={{ width: '40px', textAlign: 'center' }}
                  body={(_, { rowIndex }) => {
                    return rowIndex + 1;
                  }}
                />
                <Column header="Description" field="description" style={{ width: '40%' }} />
                <Column header="Account" field="account" />
                <Column
                  header="Debit"
                  field="debit"
                  body={(data) => {
                    return Number(data.debit)?.toLocaleString('en-US', { maximumFractionDigits: 0 });
                  }}
                />
                <Column
                  header="Credit"
                  field="credit"
                  body={(data) => {
                    return Number(data.credit)?.toLocaleString('en-US', { maximumFractionDigits: 0 });
                  }}
                />
              </DataTable>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
