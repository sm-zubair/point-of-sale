'use client';

import { useFormik } from 'formik';
import { FilterMatchMode } from 'primereact/api';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Divider } from 'primereact/divider';
import { Fieldset } from 'primereact/fieldset';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { create, getAll, remove, update } from '../../../actions';
import notify from '../../../helpers/notify';

export default function StaffPage() {
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);

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
      phone: '',
      commission: 0,
      isServing: false,
    },
    validationSchema: Yup.object({
      name: Yup.string().required(),
      phone: Yup.string().required(),
      commission: Yup.number().required(),
      isServing: Yup.boolean().required(),
    }),
    onSubmit: async (values) => {
      try {
        if (selectedStaff) {
          const item = await update(
            'Staff',
            { id: selectedStaff.id },
            { name: values.name, phone: values.phone, commission: values.commission, isServing: values.isServing }
          );
          if (item) {
            const _staff = staff.filter((c) => c.id !== selectedStaff.id);
            _staff.push({ ...selectedStaff, ...values });
            setStaff(_staff);
            notify('success', 'Staff updated', 'Success');
          }
        } else {
          const item = await create('Staff', {
            name: values.name,
            phone: values.phone,
            commission: values.commission,
            isServing: values.isServing,
          });
          notify('success', 'Staff added', 'Success');
          setStaff([...staff, item]);
        }
        setSelectedStaff(null);
        formik.resetForm();
      } catch (e: any) {
        notify('error', 'Error', e.message);
      }
    },
  });

  useEffect(() => {
    if (selectedStaff) {
      formik.setValues({
        name: selectedStaff.name,
        phone: selectedStaff.phone,
        commission: selectedStaff.commission,
        isServing: selectedStaff.isServing,
      });
    }
  }, [selectedStaff]);

  useEffect(() => {
    getAll('Staff', {
      order: {
        name: 'ASC',
      },
    }).then((staff) => {
      setStaff(staff);
    });
  }, []);

  return (
    <>
      <Fieldset legend="Add / Edit Staff" className="min-h-[768px]">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex flex-col gap-4">
              <IconField iconPosition="left">
                <InputIcon className="pi pi-barcode" />
                <InputText
                  placeholder="Name"
                  name="name"
                  className="w-full"
                  autoComplete="off"
                  invalid={formik.errors.name ? true : false}
                  {...formik.getFieldProps('name')}
                />
              </IconField>
              <IconField iconPosition="left">
                <InputIcon className="pi pi-dollar" />
                <InputText
                  keyfilter="int"
                  placeholder="Commission"
                  name="commission"
                  className="w-full"
                  autoComplete="off"
                  invalid={formik.errors.commission ? true : false}
                  {...formik.getFieldProps('commission')}
                />
              </IconField>
              <IconField iconPosition="left">
                <InputIcon className="pi pi-sort-numeric-up" />
                <InputText
                  keyfilter="int"
                  placeholder="Phone"
                  name="phone"
                  className="w-full"
                  autoComplete="off"
                  invalid={formik.errors.phone ? true : false}
                  {...formik.getFieldProps('phone')}
                />
              </IconField>
              <div className="flex items-center gap-2">
                <Checkbox
                  inputId="isServing"
                  name="isServing"
                  checked={formik.values.isServing || false}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <label htmlFor="isServing" className="cursor-pointer font-bold">
                  Is Serving
                </label>
              </div>
              <Divider />
              <div className="flex justify-between">
                <Button
                  label="Delete"
                  severity="danger"
                  type="button"
                  disabled={!selectedStaff}
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to delete this staff?')) return;
                    const result = await remove('Staff', { id: selectedStaff.id });
                    if (result) {
                      const _staff = staff.filter((c) => c.id !== selectedStaff.id);
                      setStaff(_staff);
                      notify('success', 'Staff deleted', 'Success');
                    }
                    formik.resetForm();
                    setSelectedStaff(null);
                  }}
                />
                <div className="flex gap-4">
                  <Button
                    label="Cancel"
                    severity="secondary"
                    type="button"
                    onClick={() => {
                      formik.resetForm();
                      setSelectedStaff(null);
                    }}
                  />

                  <Button
                    label={selectedStaff ? 'Update' : 'Add'}
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
              value={staff}
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
              onSelectionChange={(e) => setSelectedStaff(e.value)}
              pt={{
                header: {
                  className: 'p-0 px-2',
                },
              }}
            >
              <Column field="name" header="Name"></Column>
              <Column field="phone" header="Phone"></Column>
              <Column field="commission" header="Commission"></Column>
              <Column field="isServing" header="Is Serving"></Column>
            </DataTable>
          </div>
        </div>
      </Fieldset>
    </>
  );
}
