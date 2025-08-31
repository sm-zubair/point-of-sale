'use client';

import { useFormik } from 'formik';
import { FilterMatchMode } from 'primereact/api';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Divider } from 'primereact/divider';
import { Dropdown } from 'primereact/dropdown';
import { Fieldset } from 'primereact/fieldset';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { create, getAll, query, remove, update } from '../../../actions';
import notify from '../../../helpers/notify';

export default function CategoriesPage() {
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

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
      categoryId: null,
    },
    validationSchema: Yup.object({
      name: Yup.string().required(),
      order: Yup.number().required(),
      price: Yup.number().required(),
      categoryId: Yup.string().optional().nullable(),
    }),
    onSubmit: async (values) => {
      try {
        if (selectedCategory) {
          const item = await update(
            'Category',
            { id: selectedCategory.id },
            { name: values.name, price: values.price, order: values.order, categoryId: values.categoryId }
          );
          if (item) {
            const _categories = categories.filter((c) => c.id !== selectedCategory.id);
            _categories.unshift({ ...values, ...selectedCategory });
            setCategories(_categories);
            notify('success', 'Category updated', 'Success');
          }
        } else {
          const item = await create('Category', {
            name: values.name,
            price: values.price,
            order: values.order,
            categoryId: values.categoryId,
          });
          notify('success', 'Category added', 'Success');
          setCategories([item, ...categories]);
        }
        setSelectedCategory(null);
        formik.resetForm();
      } catch (e: any) {
        notify('error', 'Error', e.message);
      }
    },
  });

  useEffect(() => {
    if (selectedCategory) {
      formik.setValues({
        name: selectedCategory.name,
        price: selectedCategory.price,
        order: selectedCategory.order,
        categoryId: selectedCategory.categoryId,
      });
    }
  }, [selectedCategory]);

  useEffect(() => {
    getAll('Category', {
      order: {
        order: 'ASC',
        categoryId: 'ASC',
      },
    }).then((categories) => {
      setCategories(categories);
    });
  }, []);

  return (
    <>
      <Fieldset legend="Add / Edit Category" className="min-h-[768px]">
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
                  placeholder="Price"
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
                  keyfilter="int"
                  placeholder="Order"
                  name="order"
                  className="w-full"
                  autoComplete="off"
                  invalid={formik.errors.order ? true : false}
                  {...formik.getFieldProps('order')}
                />
              </IconField>
              <Dropdown
                options={categories}
                placeholder="Parent Category"
                optionLabel="name"
                optionValue="id"
                {...formik.getFieldProps('categoryId')}
              />
              <Divider />
              <div className="flex justify-between">
                <Button
                  label="Delete"
                  severity="danger"
                  type="button"
                  disabled={!selectedCategory}
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to delete this category?')) return;
                    const items = await query(
                      `SELECT name FROM items where JSON_CONTAINS(categories, '"${selectedCategory.id}"');`
                    );
                    if (items.length > 0) {
                      notify('error', 'Category has items', items.map((i: any) => i.name).join(', '));
                      return;
                    }
                    const result = await remove('Category', { id: selectedCategory.id });
                    if (result) {
                      const _categories = categories.filter((c) => c.id !== selectedCategory.id);
                      setCategories(_categories);
                      notify('success', 'Category deleted', 'Success');
                    }
                    formik.resetForm();
                    setSelectedCategory(null);
                  }}
                />
                <div className="flex gap-4">
                  <Button
                    label="Cancel"
                    severity="secondary"
                    type="button"
                    onClick={() => {
                      formik.resetForm();
                      setSelectedCategory(null);
                    }}
                  />

                  <Button
                    label={selectedCategory ? 'Update' : 'Add'}
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
              value={categories}
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
              onSelectionChange={(e) => setSelectedCategory(e.value)}
              pt={{
                header: {
                  className: 'p-0 px-2',
                },
              }}
            >
              <Column field="order" header="Order" sortable></Column>
              <Column field="name" header="Name"></Column>
              <Column field="price" header="Price"></Column>
              <Column
                field="categoryId"
                header="Category"
                body={(rowData) => {
                  const category = categories.find((c) => c.id === rowData.categoryId);
                  return category ? category.name : '';
                }}
              ></Column>
            </DataTable>
          </div>
        </div>
      </Fieldset>
    </>
  );
}
