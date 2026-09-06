import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { Home, Users, Network, MessageCircle, CalendarDays, LogOut, Sun, Moon, Menu, Search, BookOpen, Activity } from 'lucide-react';
import { useState } from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export default function Layout() {
  const { userData } = useAuthStore();
  const { theme, toggleTheme } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: Home },
    { label: 'Pohon Keluarga', path: '/tree', icon: Network },
    { label: 'Anggota', path: '/members', icon: Users },
    { label: 'Pesan Keluarga', path: '/chat', icon: MessageCircle },
    { label: 'Acara & Ultah', path: '/events', icon: CalendarDays },
    { label: 'Kenangan & Sejarah', path: '/history', icon: BookOpen },
  ];

  const Sidebar = () => (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border text-foreground">
      <div className="flex flex-col p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">T</div>
          <span className="font-semibold text-lg tracking-tight">Fam.Tegal</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
        
        {userData?.role === 'admin' && (
          <Link
            to="/logs"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              location.pathname === '/logs' ? 'bg-yellow-500/10 text-yellow-500' : 'text-yellow-600 hover:bg-muted hover:text-yellow-500'
            }`}
          >
            <Activity className="mr-3 h-4 w-4 flex-shrink-0" />
            Log Aktifitas Admin
          </Link>
        )}
      </nav>
      <div className="p-4 border-t border-border/50">
        <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase text-indigo-400 font-bold">System Health</span>
            <span className="text-[10px] text-emerald-400">CI/CD Active</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate text-foreground">{userData?.displayName || 'Anggota'}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{userData?.role || 'member'}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Keluar" className="h-6 w-6 text-muted-foreground hover:text-white">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-40 w-64 shadow-xl">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center justify-between px-4 md:px-8 border-b border-border bg-card">
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5 text-foreground" />
            </Button>
            <h1 className="ml-3 text-lg font-bold truncate">Fam.Tegal</h1>
          </div>
          
          <div className="hidden md:block relative w-96">
            <Input type='text' className='w-full rounded-full pl-10' placeholder='Cari (dummy)...' />
            <Search className='w-4 h-4 absolute left-3.5 top-2.5 text-muted-foreground' />
          </div>
          
          <div className="flex-1 md:hidden" />
          
          <div className="flex items-center gap-6">
            <div className="relative flex items-center hidden md:flex">
              <CalendarDays className="w-6 h-6 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold text-white">!</span>
            </div>
            
            <div className="flex items-center gap-3 md:border-l border-border md:pl-6">
              <div className="hidden md:block text-right">
                <div className="text-xs font-semibold">{userData?.displayName}</div>
                <div className="text-[10px] text-emerald-400 font-medium capitalize">{userData?.role}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20 flex items-center justify-center text-xs font-bold text-white">
                {userData?.displayName?.substring(0, 2).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
