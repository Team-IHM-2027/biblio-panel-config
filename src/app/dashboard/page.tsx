'use client';

import React, { useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';

export default function DashboardPage() {
  useEffect(() => {
    console.log('DashboardPage mounted');
  }, []);

  return (
    <ProtectedRoute>
      <SuperAdminDashboard />
    </ProtectedRoute>
  );
}