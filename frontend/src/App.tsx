import React from 'react';
import LoginButton from './components/LoginButton';

function App() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🎥 Streaming Overlay System</h1>
      <p>直播主 OBS 資訊顯示系統</p>
      
      <div style={{ margin: '30px 0', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>使用者認證</h2>
        <LoginButton />
      </div>
      
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <p>系統狀態：正常運行</p>
        <p>Firebase 整合：已完成</p>
      </div>
    </div>
  );
}

export default App;
