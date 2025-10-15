'use client';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { useEffect, useState } from 'react';
import { getAccounts } from '../../../actions';
import store from '../../../store';

export default function GeneralLedger() {
  //   const { shift } = useAuth();
  const accounts = store((s) => s.accounts);
  const [ledger, setLedger] = useState([]);

  //   const cashInForm = useFormik({
  //     initialValues: {
  //       account: null,
  //       amount: 0,
  //       description: '',
  //     },
  //     validationSchema: Yup.object({
  //       account: Yup.string().required(),
  //       amount: Yup.number().required(),
  //       description: Yup.string().required(),
  //     }),
  //     validateOnBlur: false,
  //     validateOnChange: false,
  //     onSubmit: async (values) => {
  //       try {
  //         const data: ledger[] = [
  //           {
  //             id: uuid(),
  //             from: values.account,
  //             to: 'Cash',
  //             date: shift.openAt,
  //             description: values.description,
  //             amount: Number(values.amount),
  //             shiftId: shift.id,
  //           },
  //         ];
  //         if (!data.length) {
  //           notify('error', 'Error', 'No entries found');
  //           return;
  //         }
  //         const ledger = await createLedger({ data });
  //         if (ledger.count > 0) {
  //           setLedger((s) => [...s, ...data]);
  //           cashInForm.resetForm();
  //           notify('success', 'Cash in added', 'Success');
  //         }
  //       } catch (e: any) {
  //         notify('error', 'Error', e.message);
  //       }
  //     },
  //   });

  useEffect(() => {
    (async () => {
      if (!accounts.length) {
        const accounts = (await getAccounts({ orderBy: { name: 'asc' } })).map((a) => a.name);
        store.getState().staff.forEach((x) => accounts.push(x.name));
        accounts.push('Cash');
        accounts.push('Bank');
        store.setState({ accounts: accounts.sort((a, b) => a.localeCompare(b)) });
      }
    })();
  }, []);

  return (
    <Fieldset legend="General Ledger" className="min-h-[768px]">
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-4">
          <Dropdown
            options={accounts}
            placeholder="Account"
            // invalid={cashInForm.errors.account ? true : false}
            filter
            // {...cashInForm.getFieldProps('account')}
          />
          <InputText
            type="number"
            inputMode="numeric"
            name="amount"
            className="w-full"
            placeholder="Amount"
            // invalid={cashInForm.errors.amount ? true : false}
            // {...cashInForm.getFieldProps('amount')}
          />
          <InputText
            className="w-full"
            placeholder="Description"
            // invalid={cashInForm.errors.description ? true : false}
            // {...cashInForm.getFieldProps('description')}
          />
        </div>
        <div className="col-span-2">
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
            <Column header="Account" field="account" style={{ width: '30%' }} />
            <Column header="Description" field="description" style={{ width: '40%' }} />
            <Column
              header="Amount"
              field="debit"
              align="right"
              style={{ width: '20%', textAlign: 'right' }}
              body={(data) => {
                return Number(data.debit)?.toLocaleString('en-US', { maximumFractionDigits: 0 });
              }}
            />
          </DataTable>
        </div>
      </div>
    </Fieldset>
  );
}
