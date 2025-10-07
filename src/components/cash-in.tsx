import { ledger, shifts } from '@prisma/client';
import { useFormik } from 'formik';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import * as Yup from 'yup';
import { createLedger, getLedger } from '../actions';
import notify from '../helpers/notify';
import uuid from '../helpers/uuid';
type Props = {
  visible: boolean;
  accounts: string[];
  shift: shifts;
  setVisible: Dispatch<SetStateAction<boolean>>;
};

export default function CashIn({ visible, accounts, shift, setVisible }: Props) {
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    getLedger({
      where: {
        shiftId: shift.id,
      },
    })
      .then((data) => {
        setLedger(data);
      })
      .catch((e) => {
        notify('error', 'Error', e.message);
      });
  }, []);

  const cashInForm = useFormik({
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
        const data: ledger[] = [
          {
            id: uuid(),
            from: values.account,
            to: 'Cash',
            date: shift.openAt,
            description: values.description,
            amount: Number(values.amount),
            shiftId: shift.id,
          },
        ];
        if (!data.length) {
          notify('error', 'Error', 'No entries found');
          return;
        }
        const ledger = await createLedger({ data });
        if (ledger.count > 0) {
          setLedger((s) => [...s, ...data]);
          cashInForm.resetForm();
          notify('success', 'Cash in added', 'Success');
        }
      } catch (e: any) {
        notify('error', 'Error', e.message);
      }
    },
  });

  return (
    <Dialog
      header={`Cash In`}
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
              cashInForm.resetForm();
            }}
            severity="secondary"
          />
          <Button
            label="Done"
            onClick={() => {
              cashInForm.submitForm();
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
              invalid={cashInForm.errors.account ? true : false}
              filter
              {...cashInForm.getFieldProps('account')}
            />
            <InputText
              type="number"
              inputMode="numeric"
              name="amount"
              className="w-full"
              placeholder="Amount"
              invalid={cashInForm.errors.amount ? true : false}
              {...cashInForm.getFieldProps('amount')}
            />
            <InputText
              className="w-full"
              placeholder="Description"
              invalid={cashInForm.errors.description ? true : false}
              {...cashInForm.getFieldProps('description')}
            />
          </div>
          <div className="col-span-3">
            <DataTable value={ledger} className="compact-table border border-solid border-[lightgrey]" stripedRows>
              <Column
                header="#"
                field="sn"
                align="center"
                style={{ width: '40px', textAlign: 'center' }}
                body={(_, { rowIndex }) => {
                  return rowIndex + 1;
                }}
              />
              <Column header="Account" field="to" style={{ width: '30%' }} />
              <Column header="Description" field="description" style={{ width: '40%' }} />
              <Column
                header="Amount"
                field="amount"
                align="right"
                style={{ width: '20%', textAlign: 'right' }}
                body={(data) => {
                  return Number(data.amount)?.toLocaleString('en-US', { maximumFractionDigits: 0 });
                }}
              />
            </DataTable>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
