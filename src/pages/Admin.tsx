import React from 'react';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import AdminDashboard from '@/pages/admin/Dashboard';

const Admin: React.FC = () => {
  return (
    <AdminAuthProvider>
      <RequireAdmin>
        <AdminDashboard />
      </RequireAdmin>
    </AdminAuthProvider>
  );
};

export default Admin;
