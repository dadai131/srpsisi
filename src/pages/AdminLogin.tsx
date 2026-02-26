import React from 'react';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { AdminLogin } from '@/pages/admin/Login';

const AdminLoginPage: React.FC = () => {
  return (
    <AdminAuthProvider>
      <AdminLogin />
    </AdminAuthProvider>
  );
};

export default AdminLoginPage;
