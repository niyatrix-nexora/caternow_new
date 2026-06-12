import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import CustomerDashboard from './pages/customer/Dashboard';
import NewRequest from './pages/customer/NewRequest';
import CustomPackage from './pages/customer/CustomPackage';
import ViewBids from './pages/customer/ViewBids';
import VendorDashboard from './pages/vendor/Dashboard';
import VendorRequestDetail from './pages/vendor/RequestDetail';
import VendorLogin from './pages/vendor/Login';
import VendorSearch from './pages/customer/VendorSearch';
import VendorDetail from './pages/customer/VendorDetail';
import CustomerProfile from './pages/customer/Profile';
import VendorProfile from './pages/vendor/Profile';
import CustomerRegister from './pages/customer/Register';
import VendorRegister from './pages/vendor/Register';
import VendorBookings from './pages/vendor/Bookings';
import VendorEarnings from './pages/vendor/Earnings';
import IncomingRequests from './pages/vendor/IncomingRequests';
import CreatePackage from './pages/vendor/CreatePackage';
import MenuManagement from './pages/vendor/MenuManagement';
import VendorChat from './pages/vendor/Chat';

import EventTracking from './pages/customer/EventTracking';
import Chat from './pages/customer/Chat';
import Payment from './pages/customer/Payment';

function ProtectedRoute({ children, role }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useApp();

  return (
    <Routes>
      {/* Splash & Onboarding */}
      <Route path="/splash" element={<Splash />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === 'customer' ? '/customer' : '/vendor'} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/vendor/login"
        element={
          user ? (
            <Navigate to={user.role === 'customer' ? '/customer' : '/vendor'} replace />
          ) : (
            <VendorLogin />
          )
        }
      />
      <Route path="/customer/register" element={<CustomerRegister />} />
      <Route path="/vendor/register" element={<VendorRegister />} />
      
      <Route path="/customer" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/customer/new-request" element={<ProtectedRoute role="customer"><NewRequest /></ProtectedRoute>} />
      <Route path="/customer/custom-package" element={<ProtectedRoute role="customer"><CustomPackage /></ProtectedRoute>} />
      <Route path="/customer/request/:id" element={<ProtectedRoute role="customer"><ViewBids /></ProtectedRoute>} />
      <Route path="/customer/chat/:id" element={<ProtectedRoute role="customer"><Chat /></ProtectedRoute>} />
      <Route path="/customer/payment/:id" element={<ProtectedRoute role="customer"><Payment /></ProtectedRoute>} />
      <Route path="/customer/tracking/:id" element={<ProtectedRoute role="customer"><EventTracking /></ProtectedRoute>} />
      <Route path="/customer/vendors" element={<ProtectedRoute role="customer"><VendorSearch /></ProtectedRoute>} />
      <Route path="/customer/vendors/:id" element={<ProtectedRoute role="customer"><VendorDetail /></ProtectedRoute>} />
      <Route path="/customer/profile" element={<ProtectedRoute role="customer"><CustomerProfile /></ProtectedRoute>} />
      
      <Route path="/vendor" element={<ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>} />
      <Route path="/vendor/requests" element={<ProtectedRoute role="vendor"><IncomingRequests /></ProtectedRoute>} />
      <Route path="/vendor/packages/new" element={<ProtectedRoute role="vendor"><CreatePackage /></ProtectedRoute>} />
      <Route path="/vendor/menu" element={<ProtectedRoute role="vendor"><MenuManagement /></ProtectedRoute>} />
      <Route path="/vendor/request/:id" element={<ProtectedRoute role="vendor"><VendorRequestDetail /></ProtectedRoute>} />
      <Route path="/vendor/chat/:id" element={<ProtectedRoute role="vendor"><VendorChat /></ProtectedRoute>} />
      <Route path="/vendor/bookings" element={<ProtectedRoute role="vendor"><VendorBookings /></ProtectedRoute>} />
      <Route path="/vendor/earnings" element={<ProtectedRoute role="vendor"><VendorEarnings /></ProtectedRoute>} />
      <Route path="/vendor/profile" element={<ProtectedRoute role="vendor"><VendorProfile /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </Router>
  );
}
