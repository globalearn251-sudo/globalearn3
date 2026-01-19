import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Gift, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/vip-products', label: 'Products', icon: Package },
  { path: '/lucky-draw', label: 'Lucky Draw', icon: Gift },
  { path: '/team', label: 'Team', icon: Users },
  { path: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const { profile } = useAuth();

  // Hide bottom nav if KYC is not approved (unless admin)
  // TEMPORARILY DISABLED FOR DEBUGGING
  /*
  if (profile && profile.role !== 'admin' && profile.kyc_status !== 'approved') {
    return null;
  }
  */

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
