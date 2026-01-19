import { lazy } from 'react';
import type { ReactNode } from 'react';
import { AdminLayout } from './components/layouts/AdminLayout';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const VipProductsPage = lazy(() => import('./pages/VipProductsPage'));
const LuckyDrawPage = lazy(() => import('./pages/LuckyDrawPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RechargePage = lazy(() => import('./pages/RechargePage'));
const WithdrawalPage = lazy(() => import('./pages/WithdrawalPage'));
const DailyEarningsPage = lazy(() => import('./pages/DailyEarningsPage'));
const KycSubmitPage = lazy(() => import('./pages/KycSubmitPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminVipProductsPage = lazy(() => import('./pages/admin/AdminVipProductsPage'));
const AdminRechargesPage = lazy(() => import('./pages/admin/AdminRechargesPage'));
const AdminWithdrawalsPage = lazy(() => import('./pages/admin/AdminWithdrawalsPage'));
const AdminKycPage = lazy(() => import('./pages/admin/AdminKycPage'));
const AdminLuckyDrawPage = lazy(() => import('./pages/admin/AdminLuckyDrawPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminEarningsPage = lazy(() => import('./pages/admin/AdminEarningsPage'));
const AdminNotificationsPage = lazy(() => import('./pages/admin/AdminNotificationsPage'));
const AdminPurchaseReportPage = lazy(() => import('./pages/admin/AdminPurchaseReportPage'));
const AdminReferralReportPage = lazy(() => import('./pages/admin/AdminReferralReportPage'));
const AdminBalanceReportPage = lazy(() => import('./pages/admin/AdminBalanceReportPage'));

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  children?: RouteConfig[];
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <HomePage />,
  },
  {
    name: 'Products',
    path: '/products',
    element: <ProductsPage />,
  },
  {
    name: 'VIP Products',
    path: '/vip-products',
    element: <VipProductsPage />,
  },
  {
    name: 'Lucky Draw',
    path: '/lucky-draw',
    element: <LuckyDrawPage />,
  },
  {
    name: 'Team',
    path: '/team',
    element: <TeamPage />,
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    name: 'Recharge',
    path: '/recharge',
    element: <RechargePage />,
  },
  {
    name: 'Withdrawal',
    path: '/withdrawal',
    element: <WithdrawalPage />,
  },
  {
    name: 'Daily Earnings',
    path: '/daily-earnings',
    element: <DailyEarningsPage />,
  },
  {
    name: 'KYC Submit',
    path: '/kyc-submit',
    element: <KycSubmitPage />,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
  },
  {
    name: 'Signup',
    path: '/signup',
    element: <SignupPage />,
  },
  {
    name: 'Admin',
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        name: 'Admin Dashboard',
        path: '',
        element: <AdminDashboard />,
      },
      {
        name: 'Users',
        path: 'users',
        element: <AdminUsersPage />,
      },
      {
        name: 'Products',
        path: 'products',
        element: <AdminProductsPage />,
      },
      {
        name: 'VIP Products',
        path: 'vip-products',
        element: <AdminVipProductsPage />,
      },
      {
        name: 'Recharges',
        path: 'recharges',
        element: <AdminRechargesPage />,
      },
      {
        name: 'Withdrawals',
        path: 'withdrawals',
        element: <AdminWithdrawalsPage />,
      },
      {
        name: 'KYC',
        path: 'kyc',
        element: <AdminKycPage />,
      },
      {
        name: 'Lucky Draw',
        path: 'lucky-draw',
        element: <AdminLuckyDrawPage />,
      },
      {
        name: 'Daily Earnings',
        path: 'earnings',
        element: <AdminEarningsPage />,
      },
      {
        name: 'Purchase Report',
        path: 'purchase-report',
        element: <AdminPurchaseReportPage />,
      },
      {
        name: 'Referral Report',
        path: 'referral-report',
        element: <AdminReferralReportPage />,
      },
      {
        name: 'Balance Report',
        path: 'balance-report',
        element: <AdminBalanceReportPage />,
      },
      {
        name: 'Notifications',
        path: 'notifications',
        element: <AdminNotificationsPage />,
      },
      {
        name: 'Settings',
        path: 'settings',
        element: <AdminSettingsPage />,
      },
    ],
  },
];

export default routes;
