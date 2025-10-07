import { ledger, shifts } from '@prisma/client';
import { useFormik } from 'formik';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dispatch, SetStateAction } from 'react';
import * as Yup from 'yup';
import { createLedger } from '../actions';
import notify from '../helpers/notify';
import uuid from '../helpers/uuid';

type Props = {
  visible: boolean;
  accounts: string[];
  shift: shifts;
  setVisible: Dispatch<SetStateAction<boolean>>;
};

export default function CashOut({ visible, accounts, shift, setVisible }: Props) {
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
        const data: ledger[] = entries.map((x) => ({
          id: uuid(),
          account: values.account,
          date: shift.openAt,
          description: x.description,
          credit: x.credit,
          debit: 0,
          shiftId: shift.id,
        }));
        if (!data.length) {
          notify('error', 'Error', 'No entries found');
          return;
        }
        const ledger = await createLedger({ data });
        if (ledger.count > 0) {
          cashOutForm.resetForm();
          notify('success', 'Cash out added', 'Success');
        }
      } catch (e: any) {
        notify('error', 'Error', e.message);
      }
    },
  });

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

  return (
    <Dialog
      header={`Cash Out`}
      visible={visible}
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
              cashOutForm.resetForm();
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
              invalid={cashOutForm.errors.account ? true : false}
              filter
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
            <DataTable value={[]} className="compact-table border border-solid border-[lightgrey]" stripedRows>
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
  );
}
