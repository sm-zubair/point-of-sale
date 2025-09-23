'use client';

import type { categories as Category, discounts as Discount, items as Item } from '@prisma/client';
import { useFormik } from 'formik';
import { FilterMatchMode } from 'primereact/api';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Chip } from 'primereact/chip';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Divider } from 'primereact/divider';
import { Fieldset } from 'primereact/fieldset';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import {
  createDiscount,
  getCategories,
  getDiscounts,
  getItems,
  removeDiscount,
  updateDiscount,
} from '../../../actions';
import notify from '../../../helpers/notify';
import uuid from '../../../helpers/uuid';

export default function DiscountsPage() {
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState(null);

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
      value: 0,
      items: [],
      categories: [],
      isActive: false,
      autoApply: true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required(),
      value: Yup.number().required().min(1, 'Value must be at least 1').max(99, 'Value must be at most 100'),
      isActive: Yup.boolean().required(),
      autoApply: Yup.boolean().required(),
      items: Yup.array().optional(),
      categories: Yup.array().optional(),
    }),
    onSubmit: async (values) => {
      try {
        if (selectedItem) {
          const item = await updateDiscount({ where: { id: selectedItem.id }, data: values });
          if (item) {
            const _discounts = discounts.filter((i) => i.id !== selectedItem.id);
            _discounts.push({ ...selectedItem, ...values });
            setDiscounts(_discounts);
            notify('info', 'Discount updated', 'Success');
          }
        } else {
          const discount = await createDiscount({ data: { id: uuid(), ...values } });
          notify('success', 'Discount added', 'Success');
          setDiscounts([...discounts, discount]);
        }
        setSelectedItem(null);
        formik.resetForm();
      } catch (e: any) {
        notify('error', 'Error', e.message);
      }
    },
  });

  useEffect(() => {
    if (selectedItem) {
      formik.setValues({
        name: selectedItem.name,
        value: selectedItem.value,
        items: selectedItem.items,
        categories: selectedItem.categories,
        isActive: selectedItem.isActive,
        autoApply: selectedItem.autoApply,
      });
    }
  }, [selectedItem]);

  useEffect(() => {
    (async () => {
      const categories = await getCategories({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
      const items = await getItems({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
      const discounts = await getDiscounts({});
      setCategories(categories);
      setItems(items);
      setDiscounts(discounts);
    })();
  }, []);

  return (
    <>
      <Fieldset legend="Add / Edit Discount" className="min-h-[768px]">
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
                <InputIcon className="pi pi-percentage" />
                <InputText
                  keyfilter="int"
                  placeholder="Value"
                  name="value"
                  className="w-full"
                  autoComplete="off"
                  invalid={formik.errors.value ? true : false}
                  {...formik.getFieldProps('value')}
                />
              </IconField>
              <div className="flex items-center gap-2">
                <Checkbox
                  inputId="autoApply"
                  name="autoApply"
                  checked={formik.values.autoApply}
                  onChange={formik.handleChange}
                  value={true}
                />
                <label htmlFor="autoApply" className="cursor-pointer font-bold">
                  Auto Apply
                </label>
                <Divider layout="vertical" />
                <Checkbox
                  inputId="isActive"
                  name="isActive"
                  checked={formik.values.isActive}
                  onChange={formik.handleChange}
                  value={true}
                />
                <label htmlFor="isActive" className="cursor-pointer font-bold">
                  Is Active
                </label>
              </div>
              {categories.length > 0 && (
                <MultiSelect
                  options={categories}
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Categories"
                  autoComplete="off"
                  multiple={true}
                  invalid={formik.errors.categories ? true : false}
                  disabled={formik.values.items?.length > 0}
                  showClear
                  {...formik.getFieldProps('categories')}
                />
              )}
              {items.length > 0 && (
                <MultiSelect
                  options={items}
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Items"
                  autoComplete="off"
                  multiple={true}
                  invalid={formik.errors.items ? true : false}
                  disabled={formik.values.categories?.length > 0}
                  showClear
                  {...formik.getFieldProps('items')}
                />
              )}

              <Divider />
              <div className="flex justify-between">
                <Button
                  label="Delete"
                  severity="danger"
                  type="button"
                  disabled={!selectedItem}
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to delete this discount?')) return;
                    const result = await removeDiscount({ where: { id: selectedItem.id } });
                    if (result) {
                      const _discounts = discounts.filter((i) => i.id !== selectedItem.id);
                      setDiscounts(_discounts);
                      notify('success', 'Discount deleted', 'Success');
                    }
                    formik.resetForm();
                    setSelectedItem(null);
                  }}
                />
                <div className="flex gap-4">
                  <Button
                    label="Cancel"
                    severity="secondary"
                    type="button"
                    onClick={() => {
                      formik.resetForm();
                      setSelectedItem(null);
                    }}
                  />

                  <Button
                    label={selectedItem ? 'Update' : 'Add'}
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
              value={discounts}
              paginator
              rows={10}
              globalFilterFields={['name']}
              filters={filters}
              selectionMode="single"
              onSelectionChange={(e) => setSelectedItem(e.value)}
            >
              <Column field="name" header="Name" style={{ width: '200px' }} />
              <Column field="value" header="Value" align="center" style={{ textAlign: 'center', width: '100px' }} />
              <Column
                field="isActive"
                header="Active"
                align="center"
                style={{ textAlign: 'center', width: '100px' }}
                body={(rowData) => {
                  return (
                    <Chip
                      label={rowData.isActive ? 'Active' : 'Inactive'}
                      className={`block! font-bold ${rowData.isActive ? 'text-green-500' : 'text-red-500'}`}
                    />
                  );
                }}
              />
              <Column
                field="autoApply"
                header="Auto Apply"
                align="center"
                style={{ textAlign: 'center', width: '100px' }}
                body={(rowData) => {
                  return <Chip label={rowData.autoApply ? 'Auto' : 'Manual'} className={`block! font-bold`} />;
                }}
              />
              <Column
                field="categories"
                header="Category"
                body={(rowData) => {
                  return (
                    rowData.categories.map((c: any) => categories.find((c2: any) => c2.id === c)?.name).join(', ') ?? []
                  );
                }}
              />
              <Column
                field="items"
                header="Items"
                body={(rowData) => {
                  return rowData.items.map((c: any) => items.find((c2: any) => c2.id === c)?.name).join(', ') ?? [];
                }}
              />
            </DataTable>
          </div>
        </div>
      </Fieldset>
    </>
  );
}
