'use client';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Dropdown } from 'primereact/dropdown';
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useEffect, useMemo, useState } from 'react';
import { createShift, getNotes, getShifts, getStaff, updateShift } from '../actions';
import notify from '../helpers/notify';
import uuid from '../helpers/uuid';
import store from '../store';

export default function Home() {
  const staff = store((s) => s.staff);
  const router = useRouter();
  const [shifts, setShifts] = useState([]);
  const [notes, setNotes] = useState('');

  const [_5000, set_5000] = useState<Number>(0);
  const [_1000, set_1000] = useState<Number>(0);
  const [_500, set_500] = useState<Number>(0);
  const [_100, set_100] = useState<Number>(0);
  const [_50, set_50] = useState<Number>(0);
  const [_20, set_20] = useState<Number>(0);
  const [_10, set_10] = useState<Number>(0);
  const [counterConfirm, setCounterConfirm] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [balance, setBalance] = useState<number>(0);

  const total = useMemo(() => {
    return (
      Number(_5000) * 5000 +
      Number(_1000) * 1000 +
      Number(_500) * 500 +
      Number(_100) * 100 +
      Number(_50) * 50 +
      Number(_20) * 20 +
      Number(_10) * 10
    );
  }, [_5000, _1000, _500, _100, _50, _20, _10]);

  const currentShift = useMemo(() => {
    const openShift = shifts.find((shift) => shift.closeAt === null);
    if (!openShift) return null;
    setSelectedShift(openShift);
    return openShift;
  }, [shifts]);

  const sales = useMemo(() => {
    if (!selectedShift?.sales) return {};
    let dineIn = 0;
    let takeAway = 0;
    let delivery = 0;
    let grossDineIn = 0;
    let grossTakeAway = 0;
    let grossDelivery = 0;
    let grossTotal = 0;
    let netTotal = 0;
    for (let i = 0; i < selectedShift.sales.length; i++) {
      const sale = selectedShift.sales[i];
      dineIn += Number(sale.dineIn);
      takeAway += Number(sale.takeAway);
      delivery += Number(sale.delivery);
      grossDineIn += Number(sale.grossDineIn);
      grossTakeAway += Number(sale.grossTakeAway);
      grossDelivery += Number(sale.grossDelivery);
    }

    grossTotal = grossDineIn + grossTakeAway + grossDelivery;
    netTotal = dineIn + takeAway + delivery;
    const debit = selectedShift.viewLedger[0]?.debit || 0;
    const credit = selectedShift.viewLedger[0]?.credit || 0;

    return {
      dineIn,
      takeAway,
      delivery,
      grossDineIn,
      grossTakeAway,
      grossDelivery,
      grossTotal,
      netTotal,
      debit,
      credit,
    };
  }, [selectedShift]);

  useEffect(() => {
    (async () => {
      const shifts = (
        await getShifts({
          take: 3,
          orderBy: { openAt: 'desc' },
          include: {
            statistics: true,
            sales: true,
            viewLedger: {
              where: {
                account: 'Cash',
              },
            },
          },
        })
      ).map((x) => {
        const formatted = x.openAt.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          weekday: 'long',
        });
        return {
          ...x,
          openAt: formatted,
        };
      });
      const staff = await getStaff({ orderBy: { name: 'asc' } });
      const notes = await getNotes();
      setShifts(shifts);
      console.log(`🚀 -----------------------------------🚀`);
      console.log(`🚀 | page.tsx:126 | shifts:`, shifts);
      console.log(`🚀 -----------------------------------🚀`);
      setNotes(notes);
      store.setState({
        staff,
      });
    })();
  }, []);

  return (
    <>
      <div className="p-4">
        <div className="flex gap-4">
          <Button label="Admin" severity="danger" className="nav-button grow" onClick={() => router.push('/admin')} />
          <Button
            label="POS"
            className="nav-button grow"
            onClick={() => router.push('/pos')}
            disabled={!currentShift}
          />
          <Button
            label={currentShift ? 'Close' : 'Open'}
            severity={currentShift ? 'danger' : 'success'}
            className="nav-button grow"
            onClick={() => {
              setCounterConfirm(true);
            }}
          />
        </div>
        <div className="grid grid-cols-12 gap-4 py-5">
          <div className="col-span-4">
            <Fieldset legend="Cash Counter" className="min-h-[446px] overflow-auto">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-right text-2xl font-semibold">5,000</div>
                <InputText
                  inputMode="numeric"
                  value={_5000?.toString()}
                  onChange={(e) => set_5000(Number(e.target.value))}
                />
                <div className="text-right text-2xl font-semibold">1,000</div>
                <InputText
                  inputMode="numeric"
                  value={_1000?.toString()}
                  onChange={(e) => set_1000(Number(e.target.value))}
                />
                <div className="text-right text-2xl font-semibold">500</div>
                <InputText
                  inputMode="numeric"
                  value={_500?.toString()}
                  onChange={(e) => set_500(Number(e.target.value))}
                />
                <div className="text-right text-2xl font-semibold">100</div>
                <InputText
                  inputMode="numeric"
                  value={_100?.toString()}
                  onChange={(e) => set_100(Number(e.target.value))}
                />
                <div className="text-right text-2xl font-semibold">50</div>
                <InputText
                  inputMode="numeric"
                  value={_50?.toString()}
                  onChange={(e) => set_50(Number(e.target.value))}
                />
                <div className="text-right text-2xl font-semibold">20</div>
                <InputText
                  inputMode="numeric"
                  value={_20?.toString()}
                  onChange={(e) => set_20(Number(e.target.value))}
                />
                <div className="text-right text-2xl font-semibold">10</div>
                <InputText
                  inputMode="numeric"
                  value={_10?.toString()}
                  onChange={(e) => set_10(Number(e.target.value))}
                />
                <div className="col-span-2 mt-1 text-right text-3xl font-semibold text-green-600">
                  {total.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className="col-span-4">
                  <Button
                    label="Reset"
                    severity="danger"
                    onClick={() => {
                      set_5000(0);
                      set_1000(0);
                      set_500(0);
                      set_100(0);
                      set_50(0);
                      set_20(0);
                      set_10(0);
                    }}
                    outlined
                    className="mt-5 w-full"
                  />
                </div>
              </div>
            </Fieldset>
          </div>
          <div className="col-span-4">
            <Fieldset legend="Statistics" className="min-h-[446px] overflow-auto">
              <div className="grid grid-cols-4 gap-2">
                <div className="text-right font-semibold">Date :</div>
                <div className="col-span-3 mb-5 font-semibold">
                  <Dropdown
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.value)}
                    options={shifts}
                    optionLabel="openAt"
                    placeholder="Select a Shift"
                    className="w-full border-0"
                    pt={{
                      input: {
                        className: 'p-0 text-black underline',
                      },
                    }}
                  />
                </div>
                <div className="text-right font-semibold">Open :</div>
                <div className="font-semibold">
                  {selectedShift?.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className="text-right font-semibold">Close :</div>
                <div className="font-semibold">
                  {selectedShift?.closingBalance?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <Divider className="col-span-4" />
                <div className="text-right font-semibold">Orders :</div>
                <div className="font-semibold">
                  {selectedShift?.statistics?.totalOrders.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className="text-right font-semibold">Dine In :</div>
                <div className="font-semibold">
                  {selectedShift?.statistics?.dineIn.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className="text-right font-semibold">Take Away :</div>
                <div className="font-semibold">
                  {selectedShift?.statistics?.takeAway.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className="text-right font-semibold">Delivery :</div>
                <div className="font-semibold">
                  {selectedShift?.statistics?.delivery.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <Divider className="col-span-4 my-1" />
                <div className="text-right font-semibold">Cash :</div>
                <div className="font-semibold">
                  {(
                    Number(selectedShift?.statistics?.cash ?? 0) +
                    Number(selectedShift?.openingBalance ?? 0) -
                    Number(sales.credit ?? 0) +
                    Number(sales.debit ?? 0)
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                  })}
                </div>
                <div className="text-right font-semibold">Online :</div>
                <div className="font-semibold">
                  {selectedShift?.statistics?.online.toLocaleString('en-US', { minimumFractionDigits: 0 }) ?? 0}
                </div>
                <div className="text-right font-semibold">Bank :</div>
                <div className="font-semibold">
                  {selectedShift?.statistics?.bank.toLocaleString('en-US', { minimumFractionDigits: 0 }) ?? 0}
                </div>
                <div className="text-right font-semibold">Credit :</div>
                <div className="font-semibold">
                  {selectedShift?.statistics?.credit.toLocaleString('en-US', { minimumFractionDigits: 0 }) ?? 0}
                </div>
                {/* <div className="text-right font-semibold">Online Due :</div>
                <div className="font-semibold">
                  {selectedShift?.statistics?.onlineDue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div> */}
                <Divider className="col-span-4" />
                <div className="text-right font-semibold">Expenses :</div>
                <div className="font-semibold">
                  {sales.credit?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className="text-right font-semibold">Deposit :</div>
                <div className="font-semibold">
                  {sales.debit?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
              </div>
            </Fieldset>
          </div>
          <div className="col-span-4">
            <Fieldset legend="Sales" className="grow overflow-auto" toggleable collapsed>
              {/* <div className="flex justify-evenly gap-2">
                <div className="font-semibold">
                  Dine In: {dineIn?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className="font-semibold">
                  Take Away: {takeAway?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className="font-semibold">
                  Delivery: {delivery?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
              </div> */}
              <div className="mb-2 grid grid-cols-3 gap-2 border-0 border-b border-[lightgrey]">
                <div className="font-semibold">Type</div>
                <div className="text-right font-semibold">Gross Total</div>
                <div className="text-right font-semibold">Net Sale</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>Dine In</div>
                <div className="text-right">
                  {sales?.grossDineIn?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className="text-right">{sales?.dineIn?.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
                <div>Take Away</div>
                <div className="text-right">
                  {sales?.grossTakeAway?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className="text-right">
                  {sales?.takeAway?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div>Delivery</div>
                <div className="text-right">
                  {sales?.grossDelivery?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className="text-right">
                  {sales?.delivery?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div></div>
                <div className="border-0 border-t text-right font-semibold">
                  {sales?.grossTotal?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className="border-0 border-t text-right font-semibold">
                  {sales?.netTotal?.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
              </div>

              <Divider />
              <div className="mb-2 grid grid-cols-3 gap-2 border-0 border-b border-[lightgrey]">
                <div className="font-semibold">Waiter</div>
                <div className="text-right font-semibold">Net Sales</div>
                <div className="text-right font-semibold">Commission</div>
              </div>
              {selectedShift?.sales
                ?.filter((sale) => sale.waiter)
                .map((sale, i) => {
                  return (
                    <div key={i} className="grid grid-cols-3 gap-2">
                      <div>{sale.waiter}</div>
                      <div className="text-right">
                        {Number(sale.waiterNetSales).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </div>
                      <div className="text-right">
                        {Number(sale.waiterCommission).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                  );
                })}
            </Fieldset>
            <Divider />
            <Fieldset legend="Notes" className="min-h-[330px] overflow-auto">
              <InputTextarea
                className="w-full"
                value={notes}
                rows={4}
                onChange={(e) => {
                  setNotes(e.target.value);
                }}
              />
              {/* <Button label="Save" onClick={() => saveNotes(notes)} outlined className="mt-2 w-full" /> */}
            </Fieldset>
          </div>
        </div>
      </div>
      {counterConfirm && (
        <Dialog
          header={currentShift ? 'Close' : 'Open'}
          visible={true}
          onHide={() => {
            setCounterConfirm(false);
            setSelectedStaff(null);
            setBalance(null);
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
                severity="secondary"
                onClick={() => {
                  setCounterConfirm(false);
                  setSelectedStaff(null);
                  setBalance(null);
                }}
              />
              <Button
                label="Done"
                disabled={!selectedStaff || balance <= 0}
                onClick={async () => {
                  try {
                    if (currentShift) {
                      //close shift
                      const shift = await updateShift({
                        where: { id: currentShift.id },
                        data: {
                          closingStaff: selectedStaff.name,
                          closeAt: new Date(),
                          closingBalance: balance,
                        },
                      });
                      notify('success', 'Shift closed', 'Success');
                      const _shifts = shifts.filter((x) => x.id !== currentShift.id);
                      _shifts.unshift({
                        ...currentShift,
                        closeAt: new Date(),
                        closingBalance: balance,
                      });
                      setShifts(_shifts);
                      setSelectedShift(null);
                    } else {
                      //open shift
                      const shift = await createShift({
                        data: {
                          id: uuid(),
                          openingStaff: selectedStaff.name,
                          openingBalance: balance,
                          openAt: new Date(),
                        },
                      });
                      console.log(shift);
                      setShifts([
                        {
                          ...shift,
                          openAt: shift.openAt.toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            weekday: 'long',
                          }),
                        },
                        ...shifts,
                      ]);
                      notify('success', 'Shift opened', 'Success');
                    }
                  } catch (e: any) {
                    notify('error', 'Error', e.message);
                  }
                  setCounterConfirm(false);
                  setSelectedStaff(null);
                  setBalance(null);
                }}
                severity="success"
              />
            </div>
          )}
          draggable={false}
          resizable={false}
        >
          <div className="relative grid grid-cols-1 gap-4">
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-user"></i>
              </span>
              <Dropdown
                options={staff.filter((x) => !x.isServing)}
                placeholder="Select a staff"
                optionLabel="name"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.value)}
                className="w-full"
              />
            </div>
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-money-bill"></i>
              </span>
              <InputText
                placeholder="Balance"
                value={balance > 0 ? balance.toString() : ''}
                onChange={(e) => setBalance(Number(e.target.value))}
              />
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
