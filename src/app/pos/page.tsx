'use client';
import { deleted_orders, discounts, type items, type orders as Order, type orders } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createOrder,
  createOrderDelete,
  getAccounts,
  getCategories,
  getDiscounts,
  getItems,
  getOrders,
  getShift,
  getStaff,
  removeOrder,
  removeOrderDetails,
  updateOrder,
} from '../../actions';
import CashIn from '../../components/cash-in';
import CashOut from '../../components/cash-out';
import OrderItems from '../../components/order-items';
import SaleReturn from '../../components/sale-return';
import OrderStatus from '../../constants/order-status';
import OrderType from '../../constants/order-type';
import notify from '../../helpers/notify';
import handlePrint from '../../helpers/print';
import uuid from '../../helpers/uuid';
import store from '../../store';

export default function POS() {
  const router = useRouter();
  const shift = store((s) => s.shift);
  const staff = store((s) => s.staff);
  const categories = store((s) => s.categories);
  const items = store((s) => s.items);
  const orders = store((s) => s.orders);
  const discounts = store((s) => s.discounts);
  const autoApplyDiscounts = store((s) => s.autoApplyDiscounts);
  const accounts = store((s) => s.accounts);
  const order = store((s) => s.order);

  const [orderType, setOrderType] = useState<OrderType>(OrderType.DineIn);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [deletedOrder, setDeletedOrder] = useState<deleted_orders>(null);
  const [received, setReceived] = useState<number | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online' | null>(null);
  const [selectCustomer, setSelectCustomer] = useState<boolean>(false);
  const [cashOut, setCashOut] = useState<boolean>(false);
  const [cashIn, setCashIn] = useState<boolean>(false);
  const [saleReturn, setSaleReturn] = useState<boolean>(false);
  const [isNew, setIsNew] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const tableRef = useRef(null);

  const { selectedCategoryId, selectedCategory } = useMemo(() => {
    const selectedCategoryId = subCategoryId || categoryId;
    return {
      selectedCategory: categories.find((c) => c.id === selectedCategoryId)?.name,
      selectedCategoryId,
    };
  }, [categoryId, subCategoryId]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => o.type === orderType);
  }, [orders, orderType]);

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
    return (received || 0) - order?.net;
  }, [received, order?.net]);

  const handleAddItem = async (item: items) => {
    let originalPrice = categories.find((c) => c.id === selectedCategoryId && c.price > 0)?.price || item.price;
    //category factored price
    const factored = categories.find((c) => c.id === selectedCategoryId && c.factor > 0);
    if (factored) {
      originalPrice *= factored.factor;
    }
    let discountedPrice = originalPrice;
    let discount = autoApplyDiscounts.find(
      (d) => !(d.items as string[])?.length && !(d.categories as string[])?.length
    );
    if (discount) {
      //flat discount
      discountedPrice *= 1 - discount.value / 100;
    } else {
      //item discount
      discount = autoApplyDiscounts.find(
        (d) => (d.items as string[])?.includes(item.id) || (d.categories as string[])?.includes(selectedCategoryId)
      );
      if (discount) {
        discountedPrice *= 1 - discount.value / 100;
      }
    }
    if (!(order.discounts as any[])?.some((d) => d.id === discount.id) && discount) {
      store.setState((s) => ({
        order: {
          ...s.order,
          discounts: [
            ...((s.order?.discounts as any[]) ?? []),
            {
              id: discount.id,
              name: discount.name,
              value: discount.value,
            },
          ],
        },
      }));
    }
    const newItems =
      order.items?.map((existingItem) => {
        if (existingItem.itemId === item.id && selectedCategory === existingItem.category) {
          return {
            ...existingItem,
            quantity: existingItem.quantity + 1,
            totalAmount: existingItem.totalAmount + discountedPrice,
          };
        }
        return existingItem;
      }) ?? [];
    const itemExists = newItems?.some((i) => i.itemId === item.id && selectedCategory === i.category);
    if (!itemExists) {
      newItems.push({
        itemId: item.id,
        name: item.name,
        price: Math.floor(discountedPrice),
        quantity: 1,
        totalAmount: Math.floor(discountedPrice),
        originalPrice: Math.floor(originalPrice),
        category: selectedCategory,
        categoryId: selectedCategoryId,
        orderId: undefined,
      });
    }
    store.setState((s) => ({ order: { ...s.order, items: newItems } }));
  };

  const handleDeleteOrder = async () => {
    const deleted = await removeOrderDetails({
      where: { orderId: order.id },
    });
    if (deleted) {
      await removeOrder({
        where: { id: order.id },
      });
      await createOrderDelete({
        data: {
          id: uuid(),
          orderNumber: order.orderNumber,
          type: order.type,
          status: OrderStatus.Deleted,
          reason: deletedOrder?.reason,
          total: order.total,
          discount: order.discountValue,
          commission: order.commission,
          net: order.net,
          items: order.items,
          waiter: order.waiter,
          payment: order.payment,
        },
      });
      const _orders = orders.filter((o) => o.id !== order.id);
      store.setState({ orders: _orders });
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
    let discountValue;
    if (!((order.discounts as any[]) ?? [])?.length) {
      discountValue = order.discountValue;
    }
    const updated = await updateOrder({
      where: { id: order.id },
      data: {
        status,
        payment: method,
        tip,
        discountValue,
        net: order.net,
        shiftId: shift.id,
      },
    });
    if (updated) {
      const _orders = orders.filter((o) => o.id !== order.id);
      store.setState({ orders: _orders });
      notify('success', 'Order paid', 'Success', true);
      setPaymentMethod(null);
      handlePrint(order.orderNumber);
      handleOrderReset();
    } else {
      notify('error', 'Error', 'Failed to pay order');
    }
  };

  const handleOrderReset = () => {
    store.setState({ order: null });
    setCategoryId(null);
    setSubCategoryId(null);
    setIsNew(false);
    setIsEdit(false);
    setDeletedOrder(null);
    setReceived(null);
  };

  const handleOrderSave = async () => {
    try {
      const order = store.getState().order;
      const total = order.items.reduce((t, item) => t + item.originalPrice * item.quantity, 0);
      const net = order.items.reduce((t, item) => t + item.totalAmount, 0);
      const discount = total - net;
      const items = order.items;
      if (!order?.id) {
        const now = new Date();
        const item = await createOrder({
          data: {
            id: uuid(),
            orderNumber: `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`,
            type: order.type,
            status: order.status,
            waiter: order.waiter,
            payment: order.payment,
            commission: order.commission,
            total,
            discountValue: Math.ceil(discount),
            net,
            shiftId: shift.id,
            discounts: order.discounts,
            items: {
              create: items,
            },
            customer: order.customer,
          },
          include: { items: { omit: { orderId: true } } },
        });
        notify('success', 'Order added', 'Success');
        store.setState({ orders: [...orders, item] });
      } else {
        const item = await updateOrder({
          where: { id: order.id },
          data: {
            total,
            discountValue: discount,
            net,
            discounts: order.discounts,
            items: { deleteMany: {}, create: items },
            customer: order.customer,
            type: order.type,
          },
          include: { items: { omit: { orderId: true } } },
        });
        if (item) {
          store.setState((s) => ({ orders: s.orders.map((o) => (o.id === item.id ? item : o)) }));
          notify('success', 'Order updated', 'Success');
        } else {
          notify('error', 'Error', 'Failed to update order');
        }
      }
      handleOrderReset();
    } catch (e: any) {
      notify('error', 'Error', e.message);
    }
  };

  const handleApplyDiscount = (applyDiscount: discounts, apply: boolean) => {
    //check if order is selected
    if (order.id) {
      let _appliedDiscounts = discounts.filter((x) =>
        ((order.discounts as any[]) ?? [])?.some((d) => d.id === x.id)
      ) as discounts[];
      if (apply) {
        _appliedDiscounts.push(applyDiscount);
      } else {
        _appliedDiscounts = _appliedDiscounts.filter((d) => d.id !== applyDiscount.id);
      }
      const confirmation = window.confirm('Are you sure you want change discounts ?');
      if (confirmation) {
        let grossTotal = 0;
        let discountedTotal = 0;
        const newItems = order.items.map((item) => {
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
          where: { id: order.id },
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
              const newOrders = orders.filter((o) => o.id !== order.id);
              newOrders.push(updated);
              store.setState({ orders: newOrders.sort((a, b) => (a.orderNumber > b.orderNumber ? 1 : -1)) });
              notify('success', 'Order updated', 'Success');
              // handleOrderReset();
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
    }
  };

  const handleOrderMove = () => {
    if (order?.id) {
      const confirmMove = confirm('Are you sure you want to move this order?');
      if (confirmMove) {
        if (!order.customer) setSelectCustomer(true);
      }
    }
  };

  //visual feedback
  useEffect(() => {
    const table = tableRef.current;
    if (!table) {
      return;
    } else {
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
      if (shift) {
        if (!staff.length) store.setState({ staff: await getStaff({ orderBy: { name: 'asc' } }) });
        if (!categories.length) store.setState({ categories: await getCategories({ orderBy: { order: 'asc' } }) });
        if (!items.length) store.setState({ items: await getItems({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }) });
        if (!accounts.length) {
          const accounts = (await getAccounts({ orderBy: { name: 'asc' } })).map((a) => a.name);
          store.getState().staff.forEach((x) => accounts.push(x.name));
          accounts.push('Cash');
          accounts.push('Bank');
          store.setState({ accounts: accounts.sort((a, b) => a.localeCompare(b)) });
        }
        if (!orders.length) {
          store.setState({
            orders: await getOrders({
              where: {
                // shiftId: shift.id,
                status: { not: { in: [OrderStatus.Paid, OrderStatus.Due] } },
              },
              include: { items: { omit: { orderId: true } } },
              orderBy: { createdAt: 'asc' },
            }),
          });
        }
        if (!discounts.length) {
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
          store.setState({
            discounts: discounts,
            autoApplyDiscounts: discounts.filter((d) => d.autoApply),
          });
        }
      } else {
        store.setState({
          shift: await getShift({
            where: {
              closeAt: null,
            },
          }),
        });
      }
    })();
  }, [shift]);

  useEffect(() => {
    console.log(`🚀 | page.tsx:497 | order:`, order);
  }, [order]);

  if (!shift) {
    return (
      <div className="flex flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold">Please open a shift first</h1>
        <Button label="Home" icon="pi pi-home" onClick={() => router.push('/')} className="min-w-24 p-5" />
      </div>
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
          className="min-w-24 p-5"
          disabled={orderType === OrderType.DineIn || !!order?.orderNumber}
          onClick={() => {
            setOrderType(OrderType.DineIn);
          }}
        />
        <Button
          label="Take Away"
          icon="pi pi-shopping-bag"
          severity="secondary"
          badge={countTakeAway.toString()}
          className="min-w-24 p-5"
          disabled={orderType === OrderType.TakeAway || !!order?.orderNumber}
          onClick={() => {
            setOrderType(OrderType.TakeAway);
          }}
        />
        <Button
          label="Credit"
          icon="pi pi-credit-card"
          severity="secondary"
          badge={countCredit.toString()}
          className="min-w-24 p-5"
          disabled={orderType === OrderType.Credit}
          onClick={() => {
            setOrderType(OrderType.Credit);
            handleOrderMove();
          }}
        />
        <Divider layout="vertical" />
        <div className="flex grow justify-center gap-2">
          <Button
            label="Cash Out"
            icon="pi pi-minus"
            severity="info"
            className="min-w-24 p-5"
            onClick={() => setCashOut(true)}
          />
          <Button
            label="Cash In"
            icon="pi pi-plus"
            severity="info"
            className="min-w-24 p-5"
            onClick={() => setCashIn(true)}
          />
          <Button label="Inventory" icon="pi pi-box" severity="info" className="min-w-24 p-5" />
          <Button
            label="Sale Return"
            icon="pi pi-refresh"
            severity="danger"
            className="min-w-24 p-5"
            onClick={() => setSaleReturn(true)}
          />
        </div>
      </div>
      {!isNew && !isEdit ? (
        <div className="grid grid-cols-12">
          <div className="col-span-5">
            <DataTable
              dataKey="id"
              size="small"
              value={filteredOrders}
              selection={order as orders | null}
              selectionMode="single"
              scrollHeight="600px"
              rowGroupMode="subheader"
              groupRowsBy={orderType === OrderType.DineIn ? 'waiter' : 'customer'}
              sortField={orderType === OrderType.DineIn ? 'waiter' : 'orderNumber'}
              columnResizeMode="expand"
              className="compact-table"
              pt={{ wrapper: { style: { height: '600px', backgroundColor: 'white' } } }}
              showGridlines
              onSelectionChange={(e) => {
                if (e.value) {
                  store.setState({ order: e.value });
                } else {
                  store.setState({ order: null });
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
              {orderType === OrderType.DineIn && <Column header="Waiter" field="waiter" />}
              {orderType === OrderType.Credit && <Column header="Customer" field="customer" />}
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
                disabled={!!order}
                onClick={() => {
                  const now = new Date();
                  store.setState({
                    order: {
                      orderNumber: `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`,
                      type: orderType,
                      status: OrderStatus.Pending,
                      shiftId: shift.id,
                    },
                  });
                  setIsNew(true);
                  setIsEdit(false);
                  if (orderType === OrderType.Credit) setSelectCustomer(true);
                }}
                className="min-w-28 p-4"
              />
              <Divider className="my-2" />
              <Button
                label="Close"
                icon="pi pi-times"
                severity="secondary"
                disabled={!order}
                className="min-w-28 p-4"
                onClick={handleOrderReset}
              />
              <Button
                label="Edit"
                icon="pi pi-pencil"
                severity="secondary"
                disabled={!order?.id}
                onClick={() => setIsEdit(true)}
                className="min-w-28 p-4"
              />
              <Button
                label="Delete"
                icon="pi pi-times"
                severity="danger"
                disabled={!order?.id}
                onClick={() => {
                  setDeleteConfirm(true);
                }}
                className="min-w-28 p-4"
              />
              <Divider className="my-2" />
              <Button
                label="Bill"
                icon="pi pi-file"
                disabled={!order?.id}
                className="min-w-28 p-4"
                onClick={() => {
                  handlePrint(order.orderNumber);
                }}
              />
              <Divider className="my-2" />
              <Button
                label="Cash"
                icon="pi pi-money-bill"
                severity="success"
                onClick={() => {
                  setPaymentMethod('cash');
                }}
                disabled={!order?.id}
                className="min-w-28 p-4"
              />
              <Button
                label="Card"
                icon="pi pi-credit-card"
                severity="warning"
                onClick={() => {
                  setPaymentMethod('card');
                  setReceived(order?.net);
                }}
                disabled={!order?.id}
                className="min-w-28 p-4"
              />
              <Button
                label="Online"
                icon="pi pi-qrcode"
                severity="warning"
                onClick={() => {
                  setPaymentMethod('online');
                  setReceived(order?.net);
                }}
                disabled={!order?.id}
                className="min-w-28 p-4"
              />
            </div>
          </div>
          <div className="col-span-6 bg-white">
            <OrderItems items={order?.items} scrollHeight="400px" />
            <div className="w-full border-0 border-t p-4">
              <div className="flex items-center justify-between text-lg">
                <div>
                  Order : <b>{order?.orderNumber}</b>
                </div>
                <div>
                  Waiter : <b>{order?.waiter}</b>
                </div>
                <div>
                  Discount :&nbsp;
                  <b>
                    {(order?.total - order?.net).toLocaleString('en-US', {
                      maximumFractionDigits: 0,
                    })}
                  </b>
                </div>
                <div>
                  Total : <b>{order?.net.toLocaleString('en-US', { maximumFractionDigits: 0 })}</b>
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
                        order
                          ? (order.discounts as any[])?.some((d) => d.id === dis.id)
                          : autoApplyDiscounts.some((d) => d.id === dis.id)
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
          {!order?.waiter && isNew && orderType === OrderType.DineIn && (
            <div className="flex flex-wrap gap-2">
              <Button
                label="Close"
                icon="pi pi-times"
                onClick={handleOrderReset}
                severity="secondary"
                className="pos-button"
              />
              {staff
                .filter((s) => s.isServing)
                .map((waiter) => (
                  <Button
                    key={waiter.id}
                    label={waiter.name}
                    className="pos-button"
                    onClick={() => {
                      store.setState({
                        order: {
                          ...order,
                          waiter: waiter.name,
                          commission: waiter.commission,
                        },
                      });
                    }}
                  />
                ))}
            </div>
          )}
          {(order?.waiter || [OrderType.TakeAway, OrderType.Credit].includes(orderType)) && (
            <div className="grid grid-cols-12">
              <div className="col-span-5">
                <div className="flex flex-wrap gap-2">
                  {/* {categoryId && <Chip label={category} className="mb-2" />}
                  {subCategoryId && <Chip label={subCategory} className="mb-2" />} */}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {categoryId && (
                    <Button
                      label="Back"
                      icon="pi pi-arrow-left"
                      onClick={() => {
                        setCategoryId(null);
                        setSubCategoryId(null);
                      }}
                      severity="secondary"
                      className="pos-button"
                    />
                  )}
                  {categories.map((c) => {
                    const isCategory = (c.parents as string[]).length < 1 && !categoryId;
                    if (isCategory) {
                      return (
                        <Button key={c.id} label={c.name} className="pos-button" onClick={() => setCategoryId(c.id)} />
                      );
                    } else if ((c.parents as string[]).includes(selectedCategoryId)) {
                      return (
                        <Button
                          key={c.id}
                          label={c.name}
                          className="pos-button"
                          onClick={() => {
                            console.log(`🚀 | page.tsx:857 | c.id:`, c.id);
                            setSubCategoryId(c.id);
                          }}
                        />
                      );
                    }
                  })}
                  {items.map((i) => {
                    return (
                      (i.categories as string[]).includes(selectedCategoryId) && (
                        <Button
                          key={i.id}
                          label={i.name}
                          className="pos-button"
                          severity="help"
                          onClick={() => {
                            handleAddItem(i);
                          }}
                        />
                      )
                    );
                  })}
                </div>
              </div>
              <div className="col-span-1">
                <div className="flex flex-col items-center justify-center gap-1">
                  <Button
                    label="Done"
                    icon="pi pi-check"
                    onClick={handleOrderSave}
                    severity="success"
                    className="min-w-28 p-5"
                  />
                  <Divider />
                  <Button
                    label="Close"
                    icon="pi pi-times"
                    severity="secondary"
                    onClick={handleOrderReset}
                    className="min-w-28 p-5"
                  />
                </div>
              </div>
              <div className="col-span-6" ref={tableRef}>
                <OrderItems items={order?.items || []} allowItemRemove={true} />
              </div>
            </div>
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
                disabled={!deletedOrder?.reason}
                onClick={() => handleDeleteOrder()}
                severity="success"
              />
            </div>
          )}
        >
          <div className="grid grid-cols-3 gap-4">
            <Button
              label="Mistake"
              outlined
              onClick={() =>
                setDeletedOrder((s) => ({
                  ...s,
                  reason: 'By mistake',
                }))
              }
            />
            <Button
              label="Customer Request"
              outlined
              onClick={() => setDeletedOrder((s) => ({ ...s, reason: 'Customer request' }))}
            />
            <Button
              label="Complain"
              severity="danger"
              outlined
              onClick={() => setDeletedOrder((s) => ({ ...s, reason: 'Complain: ' }))}
            />
            <InputTextarea
              rows={4}
              className="col-span-3"
              value={deletedOrder?.reason || ''}
              onChange={(e) => setDeletedOrder((s) => ({ ...s, reason: e.target.value }))}
            />
          </div>
        </Dialog>
      )}
      {paymentMethod === 'cash' && (
        <Dialog
          header={`Cash # ${order.orderNumber}`}
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
                disabled={!received || returnAmount < 0}
                onClick={() => handlePayment('cash')}
                severity="success"
              />
            </div>
          )}
        >
          <div className="grid grid-cols-12 gap-4 p-2">
            <div className="col-span-5 flex items-center">
              <div className="grid w-full grid-cols-2 gap-5">
                <Button label="Rs. 10" outlined onClick={() => setReceived(Number(received ?? 0) + 10)} />
                <Button label="Rs. 50" outlined onClick={() => setReceived(Number(received ?? 0) + 50)} />
                <Button label="Rs. 100" outlined onClick={() => setReceived(Number(received ?? 0) + 100)} />
                <Button label="Rs. 200" outlined onClick={() => setReceived(Number(received ?? 0) + 200)} />
                <Button label="Rs. 500" outlined onClick={() => setReceived(Number(received ?? 0) + 500)} />
                <Button label="Rs. 1000" outlined onClick={() => setReceived(Number(received ?? 0) + 1000)} />
                <Button label="Rs. 5000" outlined onClick={() => setReceived(Number(received ?? 0) + 5000)} />
                <Button
                  label="Clear"
                  severity="danger"
                  icon="pi pi-delete-left"
                  outlined
                  onClick={() => setReceived(null)}
                />
              </div>
            </div>
            <Divider layout="vertical" className="col-span-1" />
            <div className="col-span-6 p-2">
              <div className="flex items-center justify-between p-2">
                <div className="text-lg font-bold">Total:</div>
                <div className="w-1/2 px-2 font-bold">
                  Rs. {order.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="flex items-center justify-between p-2">
                <div className="text-lg font-bold">Discount:</div>
                <div className="w-1/2 px-2 font-bold">
                  (Rs. {order.discountValue.toLocaleString('en-US', { maximumFractionDigits: 0 })})
                </div>
              </div>
              <div className="flex items-center justify-between p-2">
                <div className="text-lg font-bold">Bill:</div>
                <div className="w-1/2 px-2 font-bold">
                  Rs. {order.net.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <Divider />
              <div className="flex items-center justify-between p-2">
                <div className="text-lg font-bold">Received:</div>
                <InputText
                  value={received?.toString() || ''}
                  onChange={(e) => setReceived(Number(e.target.value))}
                  inputMode="numeric"
                  className="w-1/2 font-semibold"
                  type="number"
                />
              </div>
              {!((order.discounts as any[]) ?? []).length && (
                <div className="flex items-center justify-between p-2">
                  <div className="text-lg font-bold">Discount:</div>
                  <InputText
                    value={order.discountValue?.toString() || ''}
                    onChange={(e) => {
                      store.setState((s) => ({
                        ...s,
                        order: {
                          ...s.order,
                          discountValue: Number(e.target.value),
                          net: Number(s.order.total) - Number(e.target.value),
                        },
                      }));
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
          header={`${paymentMethod === 'card' ? 'Card' : 'Online'} # ${order.orderNumber}`}
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
                disabled={!received || returnAmount < 0}
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
                Rs. {order.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="flex items-center justify-between p-2">
              <div className="text-lg font-bold">Discount:</div>
              <div className="w-1/2 px-2 font-bold">
                (Rs. {order.discountValue.toLocaleString('en-US', { maximumFractionDigits: 0 })})
              </div>
            </div>
            <div className="flex items-center justify-between p-2">
              <div className="text-lg font-bold">Bill:</div>
              <div className="w-1/2 px-2 font-bold">
                Rs. {order.net.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <Divider />
            <div className="flex items-center justify-between p-2">
              <div className="text-lg font-bold">Received:</div>
              <InputText
                value={received?.toString() || ''}
                onChange={(e) => setReceived(Number(e.target.value))}
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
          header={`Credit # ${order.orderNumber}`}
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
                disabled={!order.customer}
                onClick={() => {
                  if (order.id) {
                    store.setState((s) => ({
                      ...s,
                      order: {
                        ...s.order,
                        type: OrderType.Credit,
                      },
                    }));
                    handleOrderSave();
                  }
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
                value={order.customer || ''}
                onChange={(e) => {
                  store.setState({
                    order: {
                      ...order,
                      customer: e.target.value,
                    },
                  });
                }}
                className="font-semibold"
              />
            </div>
          </div>
        </Dialog>
      )}
      <CashOut visible={cashOut} accounts={accounts} shift={shift} setVisible={setCashOut} />
      <CashIn visible={cashIn} accounts={accounts} shift={shift} setVisible={setCashIn} />
      {saleReturn && <SaleReturn visible={saleReturn} shift={shift} setVisible={setSaleReturn} />}
    </>
  );
}
