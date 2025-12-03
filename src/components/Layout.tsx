import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { logout, getCurrentWorker } from '../services/api';
import { useState } from 'react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const worker = getCurrentWorker();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'לוח בקרה', icon: HomeIcon },
    { path: '/tickets', label: 'כל הבקשות', icon: TicketIcon },
  ];

  return (
    <div className="min-h-screen flex" dir="rtl" style={{ backgroundColor: '#F8F8FF' }}>
      {/* Sidebar Navigation */}
      <aside 
        className="fixed right-0 top-0 h-screen w-24 p-5 flex flex-col items-center z-40"
        style={{ backgroundColor: '#08083A', borderLeft: '1px solid #14144D' }}
      >
        {/* Logo */}
        <Link to="/" className="w-14 h-14 mb-9 flex items-center justify-center">
          <div className="relative w-8 h-8">
            <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full" style={{ backgroundColor: '#E55539' }}></div>
            <div className="absolute top-0 left-0 w-3.5 h-3.5 rounded-full" style={{ backgroundColor: '#FC8042' }}></div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full" style={{ backgroundColor: '#FC8042' }}></div>
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full" style={{ backgroundColor: '#E55539' }}></div>
          </div>
        </Link>

        {/* Navigation Items */}
        <div 
          className="w-[76px] rounded-[54px] px-2 py-3 flex flex-col gap-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const IconComponent = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="group relative flex items-center justify-center"
              >
                <div 
                  className="w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all"
                  style={{ 
                    backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <IconComponent 
                    className="w-6 h-6" 
                    style={{ color: isActive ? '#E55539' : '#FFFFFF' }}
                  />
                </div>
                
                {/* Tooltip */}
                <div 
                  className="absolute right-full mr-3 px-3 py-1.5 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none"
                  style={{ backgroundColor: '#252533' }}
                >
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Section - Profile */}
        <div className="mt-auto">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-12 h-12 rounded-full overflow-hidden transition-transform hover:scale-105 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)' }}
            >
              <UserIcon className="w-6 h-6 text-white" />
            </button>

            {/* Profile Menu */}
            {showProfileMenu && (
              <div className="absolute right-full bottom-0 mr-3 bg-white rounded-2xl shadow-2xl w-56 overflow-hidden z-50">
                <div className="p-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 pb-3 mb-3" style={{ borderBottom: '1px solid #D4D4DF' }}>
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#08083A' }}
                    >
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#08083A' }}>
                        {worker?.name || 'עובד'}
                      </p>
                      <p className="text-xs" style={{ color: '#8A8A99' }}>
                        Helpdesk Admin
                      </p>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogoutIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">יציאה</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mr-24 px-12 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#08083A' }}>Commiq Helpdesk</h1>
            <p className="mt-1" style={{ color: '#8A8A99' }}>מערכת ניהול בקשות הורדת דוחות</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div 
              className="px-4 py-2 bg-white rounded-xl text-sm"
              style={{ border: '1px solid #D4D4DF', color: '#5C5C6B' }}
            >
              {worker?.name || 'עובד'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <Outlet />
      </main>

      {/* Click outside to close profile menu */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </div>
  );
}

// Icons
function HomeIcon({ className = "w-6 h-6", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function TicketIcon({ className = "w-6 h-6", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function UserIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function LogoutIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
