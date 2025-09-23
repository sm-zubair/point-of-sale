'use client';

import { useFormik } from 'formik';
import { FilterMatchMode } from 'primereact/api';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Divider } from 'primereact/divider';
import { Fieldset } from 'primereact/fieldset';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { createAccount, getAccounts, removeAccount, updateAccount } from '../../../actions';
import notify from '../../../helpers/notify';
import uuid from '../../../helpers/uuid';

export default function AccountsPage() {
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const formik = useFormik({
    initialValues: {
      name: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required(),
    }),
    onSubmit: async (values) => {
      try {
        if (selectedAccount) {
          const item = await updateAccount({
            where: {
              id: selectedAccount.id,
            },
            data: {
              name: values.name,
            },
          });
          if (item) {
            const _accounts = accounts.filter((c) => c.id !== selectedAccount.id);
            _accounts.unshift({ ...selectedAccount, ...values });
            setAccounts(_accounts);
            notify('success', 'Account updated', 'Success');
          }
        } else {
          const item = await createAccount({
            data: {
              id: uuid(),
              name: values.name,
            },
          });
          notify('success', 'Account added', 'Success');
          setAccounts([item, ...accounts]);
        }
        setSelectedAccount(null);
        formik.resetForm();
      } catch (e: any) {
        notify('error', 'Error', e.message);
      }
    },
  });

  useEffect(() => {
    if (selectedAccount) {
      formik.setValues({
        name: selectedAccount.name,
      });
    }
  }, [selectedAccount]);

  useEffect(() => {
    getAccounts({
      orderBy: {
        name: 'asc',
      },
    }).then((accounts) => {
      setAccounts(accounts);
    });
  }, []);

  return (
    <>
      <Fieldset legend="Add / Edit Category" className="min-h-[768px]">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex flex-col gap-4">
              <IconField iconPosition="left">
                <InputIcon className="pi pi-address-book" />
                <InputText
                  placeholder="Name"
                  name="name"
                  className="w-full"
                  autoComplete="off"
                  invalid={formik.errors.name ? true : false}
                  {...formik.getFieldProps('name')}
                />
              </IconField>
              <Divider />
              <div className="flex justify-between">
                <Button
                  label="Delete"
                  severity="danger"
                  type="button"
                  disabled={!selectedAccount}
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to delete this account?')) return;
                    const result = await removeAccount({ where: { id: selectedAccount.id } });
                    if (result) {
                      const _accounts = accounts.filter((c) => c.id !== selectedAccount.id);
                      setAccounts(_accounts);
                      notify('success', 'Account deleted', 'Success');
                    }
                    formik.resetForm();
                    setSelectedAccount(null);
                  }}
                />
                <div className="flex gap-4">
                  <Button
                    label="Cancel"
                    severity="secondary"
                    type="button"
                    onClick={() => {
                      formik.resetForm();
                      setSelectedAccount(null);
                    }}
                  />

                  <Button
                    label={selectedAccount ? 'Update' : 'Add'}
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
          </div>
          <div className="col-span-2">
            <DataTable
              dataKey="id"
              value={accounts}
              paginator
              rows={10}
              globalFilterFields={['name']}
              filters={filters}
              header={
                <IconField iconPosition="left">
                  <InputIcon className="pi pi-search" />
                  <InputText
                    value={globalFilterValue}
                    onChange={onGlobalFilterChange}
                    placeholder="Search"
                    className="w-full"
                    autoComplete="off"
                  />
                </IconField>
              }
              selectionMode="single"
              onSelectionChange={(e) => setSelectedAccount(e.value)}
              pt={{
                header: {
                  className: 'p-0 px-2',
                },
              }}
            >
              <Column field="id" header="ID" style={{ width: '40%' }} />
              <Column field="name" header="Name" sortable />
            </DataTable>
          </div>
        </div>
      </Fieldset>
    </>
  );
}
