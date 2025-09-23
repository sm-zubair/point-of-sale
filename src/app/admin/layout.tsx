'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { useAuth } from '../../components/auth-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push('/admin/login');
  //   }
  // }, [isAuthenticated, router]);

  // if (!isAuthenticated) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center">
  //       <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
  //     </div>
  //   );
  // }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          label="Home"
          icon="pi pi-home"
          onClick={() => {
            router.push('/');
          }}
          className="min-w-24 p-5"
        />
        <Button
          label="Items"
          icon="pi pi-tag"
          onClick={() => {
            router.push('/admin/items');
          }}
          className="min-w-24 p-5"
        />
        <Button
          label="Categories"
          icon="pi pi-list"
          onClick={() => {
            router.push('/admin/categories');
          }}
          className="min-w-24 p-5"
        />
        <Button
          label="Discounts"
          icon="pi pi-percentage"
          onClick={() => {
            router.push('/admin/discounts');
          }}
          className="min-w-24 p-5"
        />
        <Divider layout="vertical" />
        <Button
          label="Staff"
          icon="pi pi-users"
          severity="secondary"
          onClick={() => {
            router.push('/admin/staff');
          }}
          className="min-w-24 p-5"
        />
        <Button
          label="Accounts"
          icon="pi pi-money-bill"
          severity="secondary"
          onClick={() => {
            router.push('/admin/accounts');
          }}
          className="min-w-24 p-5"
        />
      </div>
      <Divider />
      <div>{children}</div>
    </>
  );
}
