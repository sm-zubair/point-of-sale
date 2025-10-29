'use client';
import { useFormik } from 'formik';
import { FilterMatchMode } from 'primereact/api';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { Divider } from 'primereact/divider';
import { Dropdown } from 'primereact/dropdown';
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { Row } from 'primereact/row';
import { useEffect, useMemo, useState } from 'react';
import * as Yup from 'yup';
import {
  createLedger,
  createShift,
  getAccounts,
  getLedger,
  getShift,
  getStaff,
  removeLedger,
  updateLedger,
} from '../../../actions';
import notify from '../../../helpers/notify';
import uuid from '../../../helpers/uuid';
import store from '../../../store';

export default function GeneralLedger() {
  //   const { shift } = useAuth();
  const accounts = store((s) => s.accounts);
  const staff = store((s) => s.staff);
  const [ledger, setLedger] = useState([]);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [visibleData, setVisibleData] = useState([]);
  const [filters, setFilters] = useState({
    from: { value: null, matchMode: FilterMatchMode.CONTAINS },
    to: { value: null, matchMode: FilterMatchMode.CONTAINS },
    description: { value: null, matchMode: FilterMatchMode.CONTAINS },
    amount: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const formik = useFormik({
    initialValues: {
      from: '',
      to: '',
      amount: '',
      description: '',
      shiftId: '',
      date: new Date(),
    },
    validationSchema: Yup.object({
      from: Yup.string().required(),
      to: Yup.string().required(),
      amount: Yup.number().required(),
      description: Yup.string().required(),
    }),
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      try {
        let shiftId = values.shiftId;
        if (!selectedLedger) {
          if (!shiftId) {
            const shift = await createShift({
              data: {
                id: uuid(),
                openAt: values.date.toLocaleDateString('en-CA') + 'T00:00:00Z',
                closeAt: values.date.toLocaleDateString('en-CA') + 'T23:59:59Z',
                openingBalance: 0,
                closingBalance: 0,
                openingStaff: 'system',
                closingStaff: 'system',
              },
            });
            if (!shift) return;
            shiftId = shift.id;
          }
          const _ledger = await createLedger({
            data: {
              id: uuid(),
              from: values.from,
              to: values.to,
              date: values.date.toISOString(),
              description: values.description,
              amount: Number(values.amount),
              shiftId,
            },
          });
          if (_ledger) {
            setLedger((s) => [...s, _ledger]);
            notify('success', 'Cash in added', 'Success');
          }
        } else {
          const _ledger = await updateLedger({
            where: { id: selectedLedger.id },
            data: {
              from: values.from,
              to: values.to,
              description: values.description,
              amount: Number(values.amount),
            },
          });
          if (_ledger) {
            setLedger((s) => s.map((c) => (c.id === selectedLedger.id ? _ledger : c)));
            notify('success', 'Cash in updated', 'Success');
          }
        }
        formik.resetForm();
        setSelectedLedger(null);
        formik.setFieldValue('date', values.date);
        formik.setFieldValue('shiftId', values.shiftId);
      } catch (e: any) {
        notify('error', 'Error', e.message);
      }
    },
  });

  const handleDateChange = async (e: any) => {
    const d = e.value;
    if (!d) return;
    formik.setFieldValue('date', new Date(d));
    const gte = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0));
    const lte = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59));
    const shift = await getShift({
      where: {
        openAt: {
          gte,
          lte,
        },
      },
    });
    if (!shift) {
      formik.resetForm();
      setLedger([]);
      formik.setFieldValue('date', new Date(d));
    } else {
      const ledger = await getLedger({
        where: {
          shiftId: shift.id,
        },
      });
      setLedger(ledger);
      formik.setFieldValue('shiftId', shift.id);
    }
  };

  const totalAmount = useMemo(() => {
    const data = visibleData?.length ? visibleData : ledger;
    return data.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [visibleData, ledger]);

  useEffect(() => {
    if (selectedLedger) {
      formik.setValues({
        from: selectedLedger.from,
        to: selectedLedger.to,
        amount: selectedLedger.amount,
        description: selectedLedger.description,
        shiftId: selectedLedger.shiftId,
        date: selectedLedger.date,
      });
    }
  }, [selectedLedger]);

  useEffect(() => {
    (async () => {
      if (!accounts.length) {
        const accounts = (await getAccounts({ orderBy: { name: 'asc' } })).map((a) => a.name);
        accounts.push('Cash');
        accounts.push('Bank');
        if (!staff.length) store.setState({ staff: await getStaff({ orderBy: { name: 'asc' } }) });
        store.getState().staff.forEach((x) => accounts.push(x.name));
        store.setState({ accounts: accounts.sort((a, b) => a.localeCompare(b)) });
        handleDateChange({ value: new Date() });
      }
    })();
  }, []);

  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column footer="Total" style={{ textAlign: 'right', fontWeight: 'bold' }} />
        <Column footer="" />
        <Column footer="" />
        <Column footer="" />
        <Column footer={totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} align="right" />
      </Row>
    </ColumnGroup>
  );

  return (
    <Fieldset legend="General Ledger" className="min-h-[768px]">
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-4">
          <Calendar
            dateFormat="dd/mm/yy"
            value={formik.values.date}
            onChange={handleDateChange}
            showIcon
            showButtonBar
          />
          <InputText
            name="shiftId"
            className="w-full"
            placeholder="Shift"
            invalid={formik.errors.shiftId ? true : false}
            disabled
            {...formik.getFieldProps('shiftId')}
          />
          <Dropdown
            options={accounts}
            placeholder="From"
            invalid={formik.errors.from ? true : false}
            filter
            {...formik.getFieldProps('from')}
          />
          <Dropdown
            options={accounts}
            placeholder="To"
            invalid={formik.errors.to ? true : false}
            filter
            {...formik.getFieldProps('to')}
          />
          <InputText
            type="number"
            inputMode="numeric"
            name="amount"
            className="w-full"
            placeholder="Amount"
            invalid={formik.errors.amount ? true : false}
            {...formik.getFieldProps('amount')}
          />
          <InputText
            className="w-full"
            placeholder="Description"
            invalid={formik.errors.description ? true : false}
            {...formik.getFieldProps('description')}
          />
          <Divider />
          <div className="flex justify-between">
            <Button
              label="Delete"
              severity="danger"
              type="button"
              disabled={!selectedLedger}
              onClick={async () => {
                if (!selectedLedger) return;
                const t = confirm('Are you sure you want to delete this ledger?');
                if (!t) return;
                const result = await removeLedger({ where: { id: selectedLedger.id } });
                if (result) {
                  const _ledger = ledger.filter((c) => c.id !== selectedLedger.id);
                  setLedger(_ledger);
                  notify('success', 'Ledger deleted', 'Success');
                }
                formik.resetForm();
                setSelectedLedger(null);
              }}
            />
            <div className="flex gap-4">
              <Button
                label="Cancel"
                severity="secondary"
                type="button"
                onClick={() => {
                  formik.resetForm();
                  setLedger([]);
                  setSelectedLedger(null);
                }}
              />

              <Button
                label={selectedLedger ? 'Update' : 'Add'}
                severity="success"
                type="submit"
                loading={formik.isSubmitting}
                onClick={() => {
                  formik.handleSubmit();
                }}
              />
            </div>
          </div>
        </div>
        <div className="col-span-2">
          <DataTable
            value={ledger}
            selection={selectedLedger}
            className="compact-table border border-solid border-[lightgrey]"
            scrollHeight="600px"
            selectionMode="single"
            rows={15}
            filterDisplay="row"
            filters={filters}
            onFilter={(e) => {
              setFilters(e.filters as any);
            }}
            onSelectionChange={(e) => {
              if (e.value) {
                setSelectedLedger(e.value);
              } else {
                setSelectedLedger(null);
                formik.resetForm();
              }
            }}
            onValueChange={(filteredValue) => setVisibleData(filteredValue)}
            footerColumnGroup={footerGroup}
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
            <Column header="From" field="from" style={{ width: '20%' }} filter filterPlaceholder="From" />
            <Column header="To" field="to" style={{ width: '20%' }} filter filterPlaceholder="To" />
            <Column
              header="Description"
              field="description"
              style={{ width: '35%' }}
              filter
              filterPlaceholder="Description"
            />
            <Column
              header="Amount"
              align="right"
              style={{ width: '20%', textAlign: 'right', paddingRight: '10px' }}
              body={(data) => {
                return Number(data.amount)?.toLocaleString('en-US', { maximumFractionDigits: 0 });
              }}
              filter
              filterPlaceholder="Amount"
            />
          </DataTable>
        </div>
      </div>
    </Fieldset>
  );
}
