import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => (
  <div className="min-h-screen bg-gray-50">
    <Sidebar />
    <div className="ml-64">
      <Outlet />
    </div>
  </div>
);