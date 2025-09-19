import React from 'react';
import { useAuth } from '../hooks/useAuth';

const LoginButton: React.FC = () => {
  const { user, signInWithGoogle, signOut, loading } = useAuth();

  if (loading) {
    return <div>載入中...</div>;
  }

  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <img src={user.photoURL || ''} alt={user.displayName || '使用者'} 
             style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
        <span>歡迎，{user.displayName}</span>
        <button onClick={signOut} 
                style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', 
                        border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          登出
        </button>
      </div>
    );
  }

  return (
    <button onClick={signInWithGoogle}
            style={{ padding: '12px 24px', backgroundColor: '#4285f4', color: 'white',
                    border: 'none', borderRadius: '4px', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', gap: '10px' }}>
      使用 Google 登入
    </button>
  );
};

export default LoginButton;
