'use client';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Divider } from 'primereact/divider';
import { Dropdown } from 'primereact/dropdown';
import { Fieldset } from 'primereact/fieldset';
import { useMemo, useState } from 'react';
import { getBankBalance, getGeneralLedger, getShifts, getTrailBalance } from '../../../actions';
import notify from '../../../helpers/notify';
import store from '../../../store';

export default function Reports() {
  const accounts = store((s) => s.accounts);
  const staff = store((s) => s.staff);

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [records, setRecords] = useState([]);
  const [report, setReport] = useState<
    'financial' | 'saleDetails' | 'dayEnd' | 'generalLedger' | 'items' | 'categories' | 'staff' | 'trialBalance'
  >();

  const getRecords = async () => {
    //get all shifts withing the date range
    if ((!startDate || !endDate) && report !== 'trialBalance') {
      return notify('error', 'Error', 'Please select date range');
    }
    if (!report) {
      return notify('error', 'Error', 'Please select report type');
    }
    const gte = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0));
    const lte = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59));
    const shifts = await getShifts({
      select: { id: true },
      where: {
        openAt: {
          gte,
          lte,
        },
      },
    });
    const shiftIds = shifts.map((x) => x.id);
    if (!shiftIds.length) return notify('info', 'No Records', 'No shifts found');
    switch (report) {
      case 'generalLedger': {
        const data = await getGeneralLedger({
          select: {
            account: true,
            description: true,
            debit: true,
            credit: true,
          },
          where: { shiftId: { in: shiftIds } },
        });
        setRecords(data);
        break;
      }
      case 'trialBalance': {
        const data = await getTrailBalance({});
        const bankBalance = await getBankBalance();
        data.unshift({
          account: 'Bank',
          debit: bankBalance,
          credit: null,
        });
        setRecords(
          data.map((x) => ({
            ...x,
            balance: x.debit - x.credit,
          }))
        );
        break;
      }
      default: {
        setRecords([]);
        break;
      }
    }
  };

  const columns = useMemo(() => {
    if (records.length > 0) {
      return Object.keys(records[0]);
    } else {
      return [];
    }
  }, [records]);

  return (
    <Fieldset legend="General Ledger" className="min-h-[768px]">
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Calendar
              dateFormat="dd/mm/yy"
              placeholder="From Date"
              value={startDate}
              onChange={(e) => setStartDate(e.value)}
              showIcon
              showButtonBar
              className="w-full"
            />
            <Calendar
              dateFormat="dd/mm/yy"
              placeholder="To Date"
              value={endDate}
              onChange={(e) => setEndDate(e.value)}
              showIcon
              showButtonBar
              className="w-full"
            />
            <Button
              label="Refresh"
              severity="success"
              icon="pi pi-refresh"
              className="w-[250px]"
              onClick={getRecords}
            />
          </div>
          <Dropdown options={accounts} placeholder="From" filter />
          <Divider />
          <div className="grid grid-cols-4 gap-3">
            <Button
              label="Financials"
              className="reports-button"
              disabled={report === 'financial'}
              onClick={() => {
                setReport('financial');
              }}
            />
            <Button
              label="Sale Details"
              className="reports-button"
              disabled={report === 'saleDetails'}
              onClick={() => {
                setReport('saleDetails');
              }}
            />
            <Button
              label="Day End"
              className="reports-button"
              disabled={report === 'dayEnd'}
              onClick={() => {
                setReport('dayEnd');
              }}
            />

            <Button
              label="Items"
              className="reports-button"
              disabled={report === 'items'}
              onClick={() => {
                setReport('items');
              }}
            />
            <Button
              label="Categories"
              className="reports-button"
              disabled={report === 'categories'}
              onClick={() => {
                setReport('categories');
              }}
            />
            <Button
              label="Staff"
              className="reports-button"
              disabled={report === 'staff'}
              onClick={() => {
                setReport('staff');
              }}
            />
            <Button
              label="General Ledger"
              className="reports-button"
              disabled={report === 'generalLedger'}
              severity="secondary"
              onClick={() => {
                setReport('generalLedger');
              }}
            />
            <Button
              label="Trial Balance"
              className="reports-button"
              disabled={report === 'trialBalance'}
              severity="secondary"
              onClick={() => {
                setReport('trialBalance');
              }}
            />
            <Button
              label="Reset"
              className="reports-button"
              onClick={() => {
                setReport(undefined);
              }}
              severity="danger"
            />
          </div>
        </div>
        <div className="col-span-2">
          <DataTable
            value={records}
            className="compact-table border border-solid border-[lightgrey]"
            scrollHeight="600px"
            selectionMode="single"
            rows={20}
            paginator
          >
            <Column
              header="#"
              field="sn"
              align="center"
              style={{ width: '5%', textAlign: 'center' }}
              body={(_, { rowIndex }) => {
                return rowIndex + 1;
              }}
            />
            {columns.map((c) => (
              <Column
                header={c}
                field={c}
                align={['debit', 'credit', 'balance'].includes(c) ? 'right' : 'left'}
                body={(row) => {
                  switch (c) {
                    case 'debit': {
                      return row[c]?.toLocaleString('en-US', { maximumFractionDigits: 0 });
                    }
                    case 'credit': {
                      return row[c]?.toLocaleString('en-US', { maximumFractionDigits: 0 });
                    }
                    case 'balance': {
                      return row[c]?.toLocaleString('en-US', { maximumFractionDigits: 0 });
                    }
                    default: {
                      return row[c];
                    }
                  }
                }}
              />
            ))}
          </DataTable>
        </div>
      </div>
    </Fieldset>
  );
}
