import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { LogIn, AlertCircle, Info } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [workerId, setWorkerId] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!workerId.trim() || !workerName.trim()) {
      setError('נא למלא את כל השדות');
      return;
    }

    login(workerId.trim(), workerName.trim());
    navigate('/');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      dir="rtl"
      style={{ backgroundColor: '#08083A' }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="bg-white rounded-[27px] shadow-2xl w-full max-w-md p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#E8E8F2', borderRadius: '50%' }}>
            <div className="relative w-8 h-8">
              <div className="absolute top-0 right-0 w-3 h-3 rounded-full" style={{ backgroundColor: '#E55539' }}></div>
              <div className="absolute top-0 left-0 w-3 h-3 rounded-full" style={{ backgroundColor: '#FC8042' }}></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full" style={{ backgroundColor: '#FC8042' }}></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 rounded-full" style={{ backgroundColor: '#E55539' }}></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#08083A' }}>Commiq Helpdesk</h1>
          <p className="mt-2" style={{ color: '#8A8A99' }}>התחברות למערכת ניהול הבקשות</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-right" style={{ color: '#3B3B4D' }}>
              מזהה עובד
            </label>
            <input
              type="text"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              placeholder="הזן את מזהה העובד שלך"
              className="w-full px-4 py-3 rounded-xl transition-colors"
              style={{ 
                backgroundColor: '#F8F8FF', 
                border: '1px solid #D4D4DF',
                color: '#08083A'
              }}
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-right" style={{ color: '#3B3B4D' }}>
              שם מלא
            </label>
            <input
              type="text"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              placeholder="הזן את שמך המלא"
              className="w-full px-4 py-3 rounded-xl transition-colors"
              style={{ 
                backgroundColor: '#F8F8FF', 
                border: '1px solid #D4D4DF',
                color: '#08083A'
              }}
            />
          </div>

          {error && (
            <div 
              className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
              style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-white"
            style={{ backgroundColor: '#08083A' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#05052E'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#08083A'}
          >
            <span>כניסה למערכת</span>
            <LogIn className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6" style={{ borderTop: '1px solid #D4D4DF' }}>
          <p className="text-center text-sm flex items-center justify-center gap-2" style={{ color: '#B9B9C9' }}>
            <Info className="w-4 h-4" />
            לבדיקה: הזן כל מזהה ושם
          </p>
        </div>
      </div>
    </div>
  );
}
