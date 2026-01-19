import { Link, useLocation, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Settings,
  Home,
  Gift,
  Coins,
  Bell,
  ShoppingBag,
  Wallet,
  Crown
} from 'lucide-react';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/vip-products', label: 'VIP Products', icon: Crown },
  { path: '/admin/purchase-report', label: 'Purchase Report', icon: ShoppingBag },
  { path: '/admin/referral-report', label: 'Referral Report', icon: Users },
  { path: '/admin/balance-report', label: 'Balance Report', icon: Wallet },
  { path: '/admin/recharges', label: 'Recharges', icon: TrendingUp },
  { path: '/admin/withdrawals', label: 'Withdrawals', icon: DollarSign },
  { path: '/admin/kyc', label: 'KYC Verification', icon: FileText },
  { path: '/admin/lucky-draw', label: 'Lucky Draw', icon: Gift },
  { path: '/admin/earnings', label: 'Daily Earnings', icon: Coins },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-card">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
        </div>
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors mt-4"
          >
            <Home className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
