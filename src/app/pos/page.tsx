'use client';

import { useFormik } from 'formik';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Chip } from 'primereact/chip';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DeepPartial } from 'typeorm';
import { create, deleteOrder, getAll, getCurrentShift, update, updateOrder } from '../../actions';
import OrderStatus from '../../constants/order-status';
import OrderType from '../../constants/order-type';
import Category from '../../database/entities/category.entity';
import Discount from '../../database/entities/discount.entity';
import Item from '../../database/entities/item.entity';
import Order from '../../database/entities/order.entity';
import Shift from '../../database/entities/shift.entity';
import Staff from '../../database/entities/staff.entity';
import notify from '../../helpers/notify';

export default function POS() {
  const router = useRouter();
  const [waiters, setWaiters] = useState<Staff[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<DeepPartial<Order>[]>([]);
  const [discounts, setDiscounts] = useState<DeepPartial<Discount>[]>([]);
  const [appliedDiscounts, setAppliedDiscounts] = useState<DeepPartial<Discount>[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online' | null>(null);
  const [currentShift, setCurrentShift] = useState<DeepPartial<Shift>>(null);
  const tableRef = useRef(null);

  const order = useFormik({
    initialValues: {
      id: null,
      orderNumber: null,
      isNew: false,
      isEdit: false,
      type: OrderType.DineIn,
      total: 0,
      discount: 0,
      net: 0,
      commission: 0,
      status: OrderStatus.Pending,
      itemLess: [],
      items: [],
      waiter: null,
      categoryId: null,
      subCategoryId: null,
      payment: null,
      createdAt: null,
      deleteReason: null,
      received: 0,
    },
    onSubmit: async (values) => {
      try {
        const total = values.items.reduce((t, item) => t + item.originalPrice * item.quantity, 0);
        const net = values.items.reduce((t, item) => t + item.totalAmount, 0);
        const discount = total - net;
        const items = values.items;
        if (values.isNew) {
          const now = new Date();
          const item = await create('Order', {
            orderNumber: `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`,
            type: values.type,
            status: values.status,
            waiter: values.waiter,
            payment: values.payment,
            commission: values.commission,
            total,
            discount,
            net,
            items,
            shiftId: currentShift.id,
          });
          notify('success', 'Order added', 'Success');
          setOrders([...orders, item]);
        } else {
          const item = await updateOrder(
            values.id,
            {
              total,
              discount,
              net,
            },
            values.items.map((item) => ({
              ...item,
              orderId: values.id,
            }))
          );
          if (item) {
            const newOrders = orders.filter((order) => order.id !== values.id);
            setOrders([...newOrders, item]);
            notify('success', 'Order updated', 'Success');
          } else {
            notify('error', 'Error', 'Failed to update order');
          }
        }
        order.resetForm();
        order.setFieldValue('type', values.type);
      } catch (e: any) {
        notify('error', 'Error', e.message);
      }
    },
  });

  const { category, subCategory, selectedCategoryId } = useMemo(() => {
    return {
      category: categories.find((c) => c.id === order.values.categoryId)?.name,
      subCategory: categories.find((c) => c.id === order.values.subCategoryId)?.name,
      selectedCategoryId: order.values.subCategoryId || order.values.categoryId,
    };
  }, [order.values.categoryId, order.values.subCategoryId]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => o.type === order.values.type);
  }, [orders, order.values.type]);

  const { countDineIn, countTakeAway, countDelivery } = useMemo(() => {
    let countDineIn = 0;
    let countTakeAway = 0;
    let countDelivery = 0;
    orders.forEach((o) => {
      if (o.type === OrderType.DineIn) countDineIn++;
      else if (o.type === OrderType.TakeAway) countTakeAway++;
      else if (o.type === OrderType.Delivery) countDelivery++;
    });
    return { countDineIn, countTakeAway, countDelivery };
  }, [orders]);

  const returnAmount = useMemo(() => {
    return (order.values.received || 0) - order.values.net;
  }, [order.values.received, order.values.net]);

  const handleAddItem = (item: Item) => {
    let originalPrice = categories.find((c) => c.id === selectedCategoryId && c.price > 0)?.price || item.price;
    let discountedPrice = originalPrice;
    const flatDiscount = appliedDiscounts
      .filter((d) => !d.items?.length && !d.categories?.length)
      .reduce((sum, d) => sum + d.value, 0);
    if (flatDiscount) {
      discountedPrice *= 1 - flatDiscount / 100;
    } else {
      const itemDiscount = appliedDiscounts.find(
        (d) => d.items?.includes(item.id) || d.categories?.includes(selectedCategoryId)
      );
      if (itemDiscount) {
        discountedPrice *= 1 - itemDiscount.value / 100;
      }
    }

    const newItems = order.values.items.map((existingItem) => {
      if (existingItem.itemId === item.id && [subCategory, category].includes(existingItem.category)) {
        return {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          totalAmount: existingItem.totalAmount + discountedPrice,
        };
      }
      return existingItem;
    });

    // check if item already exists in either category
    const itemExists = newItems.some((i) => i.itemId === item.id && [subCategory, category].includes(i.category));
    if (!itemExists) {
      newItems.push({
        itemId: item.id,
        name: item.name,
        price: discountedPrice,
        quantity: 1,
        totalAmount: discountedPrice,
        originalPrice: originalPrice,
        category: subCategory || category,
        categoryId: order.values.subCategoryId || order.values.categoryId,
      });
    }
    order.setFieldValue('items', newItems);
  };

  const handleDeleteOrder = async () => {
    const deleted = await deleteOrder(order.values.id, order.values.deleteReason, OrderStatus.Deleted);
    if (deleted) {
      const _orders = orders.filter((o) => o.id !== order.values.id);
      setOrders(_orders);
      notify('success', 'Order deleted', 'Success');
      setDeleteConfirm(false);
      order.resetForm();
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
        status = OrderStatus.Due;
        tip = returnAmount;
        break;
      }
      default: {
        status = OrderStatus.Pending;
        break;
      }
    }
    const updated = await update('Order', order.values.id, { status, payment: method, tip });
    if (updated) {
      const _orders = orders.filter((o) => o.id !== order.values.id);
      setOrders(_orders);
      notify('success', 'Order paid', 'Success', true);
      setPaymentMethod(null);
      order.resetForm();
    } else {
      notify('error', 'Error', 'Failed to pay order');
    }
  };

  useEffect(() => {
    //check if order is selected
    if (order.values.id) {
      //ask fro confimation
      const confirmation = window.confirm('Are you sure you want change discounts ?');
      if (confirmation) {
        let grossTotal = 0;
        let discountedTotal = 0;
        const newItems = order.values.items.map((item) => {
          let discountedPrice = item.originalPrice;
          const flatDiscount = appliedDiscounts
            .filter((d) => !d.items?.length && !d.categories?.length)
            .reduce((sum, d) => sum + d.value, 0);
          if (flatDiscount) {
            discountedPrice *= 1 - flatDiscount / 100;
          } else {
            const itemDiscount = appliedDiscounts.find(
              (d) => d.items?.includes(item.itemId) || d.categories?.includes(item.categoryId)
            );
            if (itemDiscount) {
              discountedPrice *= 1 - itemDiscount.value / 100;
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
        const updatedOrder = {
          ...order.values,
          orderDetails: newItems,
          total: grossTotal,
          discount: grossTotal - discountedTotal,
          net: discountedTotal,
        };
        updateOrder(
          order.values.id,
          {
            total: updatedOrder.total,
            discount: updatedOrder.discount,
            net: updatedOrder.net,
          },
          newItems
        )
          .then((updated) => {
            if (updated) {
              //refresh orders
              const newOrders = orders.filter((o) => o.id !== order.values.id);
              newOrders.push(updated);
              setOrders(newOrders);
              notify('success', 'Order updated', 'Success');
              order.resetForm();
            } else {
              notify('error', 'Error', 'Failed to update order');
            }
          })
          .catch((e) => {
            notify('error', 'Error', e.message);
          });
      }
    }
  }, [appliedDiscounts]);

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
      const currentShift = await getCurrentShift();
      if (currentShift) {
        setCurrentShift(currentShift);
        const waiters = await getAll('Staff', {
          select: {
            id: true,
            name: true,
            commission: true,
          },
          where: { isServing: true },
          order: { name: 'ASC' },
        });
        const categories = await getAll('Category', { order: { order: 'ASC' } });
        const items = await getAll('Item', { order: { order: 'ASC' } });
        const orders = await getAll('Order', {
          where: {
            shiftId: currentShift.id,
          },
          relations: {
            items: true,
          },
          order: { createdAt: 'ASC' },
        });
        const discounts = await getAll('Discount', {
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
          order: { name: 'ASC' },
        });
        setWaiters(waiters);
        setCategories(categories);
        setItems(items);
        setOrders(orders);
        setDiscounts(discounts);
        setAppliedDiscounts(discounts.filter((d) => d.autoApply));
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
          label="Delivery"
          icon="pi pi-truck"
          severity="secondary"
          badge={countDelivery.toString()}
          onClick={() => order.setFieldValue('type', OrderType.Delivery)}
          disabled={order.values.type === OrderType.Delivery || order.values.isNew}
          className="min-w-24 p-5"
        />
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
              groupRowsBy="waiter"
              sortField="waiter"
              columnResizeMode="expand"
              className="compact-table"
              pt={{ wrapper: { style: { height: '600px', backgroundColor: 'white' } } }}
              showGridlines
              onSelectionChange={(e) => {
                if (e.value) {
                  order.setValues(e.value);
                } else {
                  order.resetForm();
                }
              }}
              rowGroupHeaderTemplate={(data: Order) => (
                <div className="-mx-1.5 -my-[5px] bg-[lightgrey] p-0! text-center font-bold">{data.waiter}</div>
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
                onClick={() => order.setFieldValue('isNew', true)}
                className="min-w-28 p-5"
              />
              <Divider />
              <Button
                label="Close"
                icon="pi pi-times"
                severity="secondary"
                disabled={!order.values.id}
                onClick={() => order.resetForm()}
                className="min-w-28 p-5"
              />
              <Button
                label="Edit"
                icon="pi pi-pencil"
                severity="secondary"
                disabled={!order.values.id}
                onClick={() => order.setFieldValue('isEdit', true)}
                className="min-w-28 p-5"
              />
              <Button
                label="Delete"
                icon="pi pi-times"
                severity="danger"
                disabled={!order.values.id}
                onClick={() => {
                  setDeleteConfirm(true);
                }}
                className="min-w-28 p-5"
              />
              <Divider />
              <Button
                label="Cash"
                icon="pi pi-money-bill"
                severity="success"
                onClick={() => {
                  setPaymentMethod('cash');
                  order.setFieldValue('payment', 'cash');
                }}
                disabled={!order.values.id}
                className="min-w-28 p-5"
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
                className="min-w-28 p-5"
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
                className="min-w-28 p-5"
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
                      checked={appliedDiscounts.some((d) => d.id === dis.id)}
                      onChange={(e) => {
                        if (e.checked) {
                          setAppliedDiscounts([...appliedDiscounts, dis]);
                        } else {
                          setAppliedDiscounts(appliedDiscounts.filter((d) => d.id !== dis.id));
                        }
                      }}
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
                onClick={() => order.resetForm()}
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
                          c.categoryId === null && (
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
                            c.categoryId === order.values.categoryId && (
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
                            i.categories.includes(order.values.categoryId) && (
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
                            i.categories.includes(order.values.subCategoryId) && (
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
                      onClick={() => order.resetForm()}
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
                    <Column field="totalAmount" header="Total" className="text-center font-bold" align="center" />
                    <Column
                      field="action"
                      header="Action"
                      align="center"
                      body={(data) => (
                        <>
                          <div className="flex items-center justify-center gap-2">
                            <Button icon="pi pi-times" severity="danger" className="p-1" />
                          </div>
                        </>
                      )}
                    />
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
            order.resetForm();
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
                  order.resetForm();
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
            order.resetForm();
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
                  order.resetForm();
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
                  (Rs. {order.values.discount.toLocaleString('en-US', { maximumFractionDigits: 0 })})
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
                />
              </div>
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
            order.resetForm();
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
                  order.resetForm();
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
                (Rs. {order.values.discount.toLocaleString('en-US', { maximumFractionDigits: 0 })})
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
    </>
  );
}
