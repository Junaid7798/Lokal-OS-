import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  CheckSquare,
  Clock,
  BarChart,
  Settings,
  UserCircle,
  Star,
  ClipboardList,
  Calendar,
  Megaphone,
  Award,
  IndianRupee,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStaffTracker } from '../hooks/useStaffTracker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

const navItems: {
  to: string;
  icon: React.ElementType;
  label: string;
  tour?: string;
}[] = [
  { to: '/', icon: Home, label: 'Home', tour: 'home' },
  { to: '/customers', icon: Users, label: 'Customers', tour: 'customers' },
  { to: '/follow-ups', icon: CheckSquare, label: 'Tasks' },
  { to: '/inactive', icon: Clock, label: 'Inactive' },
  { to: '/reviews', icon: Star, label: 'Reviews' },
  { to: '/appointments', icon: Calendar, label: 'Appts', tour: 'appointments' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns', tour: 'campaigns' },
  { to: '/loyalty', icon: Award, label: 'Loyalty' },
  { to: '/revenue', icon: IndianRupee, label: 'Revenue', tour: 'analytics' },
  { to: '/leads', icon: UserCircle, label: 'Leads' },
  { to: '/data', icon: ClipboardList, label: 'Data' },
  { to: '/reports', icon: BarChart, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings', tour: 'settings' },
];

export default function Layout() {
  return (
    <div className="flex w-full h-screen bg-muted/20 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border shadow-sm z-10 shrink-0">
        <div className="p-6">
          <div className="flex items-baseline select-none">
            <span className="text-[26px] font-bold tracking-tight text-foreground">
              Lokal
            </span>
            <span className="text-[26px] font-black tracking-tighter text-primary">
              OS
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-primary ml-1 shrink-0" />
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <DesktopNavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              tour={item.tour}
            />
          ))}
        </nav>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex flex-col flex-1 min-w-0 h-screen relative bg-background">
        {/* Top bar for mobile and desktop */}
        <header className="flex bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-border h-14 items-center justify-between px-4 shrink-0">
          <div className="md:hidden flex items-baseline select-none">
            <span className="text-[22px] font-bold tracking-tight text-foreground">
              Lokal
            </span>
            <span className="text-[22px] font-black tracking-tighter text-primary">
              OS
            </span>
            <span className="w-2 h-2 rounded-full bg-primary ml-1 shrink-0" />
          </div>
          <div className="hidden md:block text-sm font-medium text-muted-foreground">
            Workspace overview
          </div>
          <StaffSelector />
        </header>

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="max-w-5xl mx-auto w-full md:p-6">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 w-full bg-card border-t border-border shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] pb-safe z-10">
          <div className="flex justify-around items-center p-2">
            {navItems.map((item) => (
              <MobileNavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

const DesktopNavItem: React.FC<{
  to: string;
  icon: React.ElementType;
  label: string;
  tour?: string;
}> = ({ to, icon: Icon, label, tour }) => {
  return (
    <NavLink
      to={to}
      data-tour={tour}
      className={({ isActive }) =>
        cn(
          'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer hover:scale-[1.02]',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )
      }
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
};

const MobileNavItem: React.FC<{
  to: string;
  icon: React.ElementType;
  label: string;
}> = ({ to, icon: Icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center w-full py-1 text-xs font-medium transition-all duration-200 active:scale-95',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )
      }
    >
      <Icon className="h-5 w-5 mb-1" />
      <span className="truncate w-full text-center text-[10px] sm:text-xs">
        {label}
      </span>
    </NavLink>
  );
};

import { useBusinessProfile } from '../hooks/useBusinessProfile';

function StaffSelector() {
  const { activeStaff, setActiveStaff } = useStaffTracker();
  const { profile } = useBusinessProfile();

  const predefinedStaffString = (profile?.staff_members as string) || 'Owner';
  const predefinedStaff = predefinedStaffString
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  if (predefinedStaff.length === 0) predefinedStaff.push('Owner');

  // Automatically select the first staff if current activeStaff is not in the list
  React.useEffect(() => {
    if (
      activeStaff &&
      !predefinedStaff.includes(activeStaff) &&
      predefinedStaff.length > 0
    ) {
      setActiveStaff(predefinedStaff[0]);
    }
  }, [predefinedStaff, activeStaff, setActiveStaff]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 rounded-full h-8 px-3 hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <UserCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{activeStaff}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Active Staff Member</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {predefinedStaff.map((staff: string) => (
            <DropdownMenuItem
              key={staff}
              onClick={() => setActiveStaff(staff)}
              className={
                activeStaff === staff
                  ? 'bg-primary/10 font-medium text-primary focus:bg-primary/20'
                  : ''
              }
            >
              {staff}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
