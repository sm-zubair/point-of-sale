'use client';

import { useFormik } from 'formik';
import { FilterMatchMode } from 'primereact/api';
import { Button } from 'primereact/button';
import { Chips } from 'primereact/chips';
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
import { create, getAll, remove, update } from '../../../actions';
import notify from '../../../helpers/notify';

export default function ItemsPage() {
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
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
      price: 0,
      order: 0,
      categories: [],
      tags: [],
    },
    validationSchema: Yup.object({
      name: Yup.string().required(),
      price: Yup.number().required(),
      order: Yup.number().required(),
      categories: Yup.array().min(1, 'At least one category is required').required(),
      tags: Yup.array().optional(),
    }),
    onSubmit: async (values) => {
      try {
        if (selectedItem) {
          const item = await update('Item', { id: selectedItem.id }, values);
          if (item) {
            const _items = items.filter((i) => i.id !== selectedItem.id);
            _items.push({ ...selectedItem, ...values });
            setItems(_items);
            notify('info', 'Item updated', 'Success');
          }
        } else {
          const item = await create('Item', values);
          notify('success', 'Item added', 'Success');
          setItems([...items, item]);
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
        price: selectedItem.price,
        order: selectedItem.order,
        categories: selectedItem.categories,
        tags: selectedItem.tags,
      });
    }
  }, [selectedItem]);

  useEffect(() => {
    getAll('Category', {}).then((categories) => {
      getAll('Item', {}).then((items) => {
        setCategories(categories);
        setItems(items);
      });
    });
  }, []);

  return (
    <>
      <Fieldset legend="Add / Edit Item" className="min-h-[768px]">
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
                  placeholder="Integers"
                  name="price"
                  className="w-full"
                  autoComplete="off"
                  invalid={formik.errors.price ? true : false}
                  {...formik.getFieldProps('price')}
                />
              </IconField>
              <IconField iconPosition="left">
                <InputIcon className="pi pi-sort-numeric-up" />
                <InputText
                  name="order"
                  keyfilter="int"
                  placeholder="Order"
                  className="w-full"
                  autoComplete="off"
                  invalid={formik.errors.order ? true : false}
                  {...formik.getFieldProps('order')}
                />
              </IconField>
              {categories.length > 0 && (
                <MultiSelect
                  options={categories}
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Categories"
                  autoComplete="off"
                  multiple={true}
                  invalid={formik.errors.categories ? true : false}
                  {...formik.getFieldProps('categories')}
                />
              )}
              <Chips
                placeholder="Tags"
                autoComplete="off"
                pt={{
                  container: {
                    className: 'p-2 w-full',
                  },
                }}
                {...formik.getFieldProps('tags')}
              />
              <Divider />
              <div className="flex justify-between">
                <Button
                  label="Delete"
                  severity="danger"
                  type="button"
                  disabled={!selectedItem}
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to delete this item?')) return;
                    const result = await remove('Item', { id: selectedItem.id });
                    if (result) {
                      const _items = items.filter((i) => i.id !== selectedItem.id);
                      setItems(_items);
                      notify('success', 'Item deleted', 'Success');
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
              value={items}
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
              onSelectionChange={(e) => setSelectedItem(e.value)}
              pt={{
                header: {
                  className: 'p-0 px-2',
                },
              }}
            >
              <Column field="order" header="Order" style={{ width: '5rem' }}></Column>
              <Column field="name" header="Name"></Column>
              <Column field="price" header="Price"></Column>
              <Column
                field="categories"
                header="Category"
                body={(rowData) => {
                  return (
                    rowData.categories.map((c: any) => categories.find((c2: any) => c2.id === c)?.name).join(', ') ?? []
                  );
                }}
              ></Column>
              <Column field="tags" header="Tags"></Column>
            </DataTable>
          </div>
        </div>
      </Fieldset>
    </>
  );
}
