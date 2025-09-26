console.log('🧪 測試依賴套件載入...');

try {
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  
  console.log('✅ 所有核心套件載入成功!');
  console.log('Express 版本:', require('express/package.json').version);
  
  // 建立簡單的測試服務器
  const app = express();
  app.use(cors());
  app.use(helmet());
  
  app.get('/test', (req, res) => {
    res.json({ message: '後端依賴測試成功!', timestamp: new Date() });
  });
  
  const server = app.listen(5001, () => {
    console.log('✅ 測試服務器啟動成功! 端口: 5001');
    
    // 2秒後自動關閉
    setTimeout(() => {
      server.close();
      console.log('✅ 測試完成，服務器已關閉');
      process.exit(0);
    }, 2000);
  });
  
} catch (error) {
  console.log('❌ 依賴載入失敗:', error.message);
  process.exit(1);
}
