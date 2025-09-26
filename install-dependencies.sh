#!/bin/bash

echo "🔧 開始修復編譯錯誤..."

# 檢查是否在正確的目錄
if [ ! -d "frontend/src" ]; then
    echo "❌ 請在專案根目錄執行此腳本"
    exit 1
fi

echo "📁 進入前端目錄..."
cd frontend

# 備份原始檔案
echo "💾 備份原始檔案..."
mkdir -p ../backups
cp src/components/style/StyleManager.tsx ../backups/StyleManager.tsx.bak 2>/dev/null || echo "⚠️ StyleManager.tsx 備份跳過"
cp src/pages/EnhancedDashboard.tsx ../backups/EnhancedDashboard.tsx.bak 2>/dev/null || echo "⚠️ EnhancedDashboard.tsx 備份跳過"
cp src/App.tsx ../backups/App.tsx.bak 2>/dev/null || echo "⚠️ App.tsx 備份跳過"
cp src/pages/OverlayView.tsx ../backups/OverlayView.tsx.bak 2>/dev/null || echo "⚠️ OverlayView.tsx 備份跳過"

echo "🔧 修復 1: StyleManager.tsx - 修復 confirm 錯誤..."
# 修復 confirm 問題
sed -i 's/if (!confirm(/if (!window.confirm(/g' src/components/style/StyleManager.tsx

echo "🔧 修復 2: StyleManager.tsx - 修復 styled-components props..."
# 創建臨時檔案來處理複雜的替換
cat > /tmp/stylemanager_fix.txt << 'EOF'
const PreviewMessage = styled.div<{ style: ChatStyle }>`
  font-family: ${(props) => props.style.font.family};
  font-size: ${(props) => props.style.font.size}px;
  font-weight: ${(props) => props.style.font.weight};
  color: ${(props) => props.style.font.color};
  background-color: ${(props) => {
    const opacity = Math.round(props.style.background.opacity * 255)
      .toString(16)
      .padStart(2, '0');
    return `${props.style.background.color}${opacity}`;
  }};
  padding: ${(props) => props.style.layout.padding}px;
  border-radius: ${(props) => props.style.layout.borderRadius}px;
  text-align: ${(props) => props.style.layout.alignment};
  backdrop-filter: ${(props) => 
    props.style.background.blur > 0 ? `blur(${props.style.background.blur}px)` : 'none'
  };
`;
EOF

# 使用 Python 來處理複雜的多行替換
python3 << 'EOF'
import re

# 讀取檔案
with open('src/components/style/StyleManager.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 替換 PreviewMessage 樣式定義
pattern = r'const PreviewMessage = styled\.div<\{ style: ChatStyle \}>`[^`]*`;'
with open('/tmp/stylemanager_fix.txt', 'r') as f:
    replacement = f.read().strip()

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# 寫回檔案
with open('src/components/style/StyleManager.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ StyleManager.tsx PreviewMessage 已修復")
EOF

echo "🔧 修復 3: EnhancedDashboard.tsx - 移除 loading 屬性..."
# 修復 EnhancedDashboard.tsx 中的 loading 問題
sed -i 's/const { user, loading } = useFirebaseAuth();/const { user } = useFirebaseAuth();/g' src/pages/EnhancedDashboard.tsx

echo "🔧 修復 4: App.tsx - 移除未使用的 imports..."
# 修復 App.tsx 中的未使用 imports
sed -i 's/import React, { useEffect } from '\''react'\'';/import React from '\''react'\'';/g' src/App.tsx
sed -i 's/import { BrowserRouter as Router, Routes, Route, Navigate } from '\''react-router-dom'\'';/import { BrowserRouter as Router, Routes, Route, Navigate } from '\''react-router-dom'\'';/g' src/App.tsx

# 移除 useDispatch 和 useSelector 相關的行
sed -i '/import.*useDispatch.*useSelector/d' src/App.tsx
sed -i '/const dispatch = useDispatch/d' src/App.tsx
sed -i '/const { user } = useSelector/d' src/App.tsx
sed -i '/RootState.*auth/d' src/App.tsx

echo "🔧 修復 5: EnhancedDashboard.tsx - 移除未使用的 imports..."
# 修復 EnhancedDashboard imports
sed -i 's/import React, { useState, useEffect } from '\''react'\'';/import React, { useState } from '\''react'\'';/g' src/pages/EnhancedDashboard.tsx
sed -i '/import.*User.*from.*firebase\/auth/d' src/pages/EnhancedDashboard.tsx

echo "🔧 修復 6: OverlayView.tsx - 修復 useEffect 依賴..."
# 修復 OverlayView.tsx 中的 useEffect 依賴
if [ -f "src/pages/OverlayView.tsx" ]; then
    sed -i 's/}, \[styleId\]);/}, [styleId, loadStyle]);/g' src/pages/OverlayView.tsx
else
    echo "⚠️ OverlayView.tsx 不存在，跳過修復"
fi

echo "🔧 修復 7: 移除其他未使用的變數..."
# 移除其他檔案中未使用的變數
files_to_check=(
    "src/pages/Dashboard.tsx"
    "src/pages/GoogleLogin.tsx"
    "src/services/firebase.ts"
    "src/services/styleService.ts"
    "src/store/slices/authSlice.ts"
    "src/store/slices/firebaseAuthSlice.ts"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "🔍 檢查 $file..."
        # 這裡可以添加更具體的修復，但先跳過以避免意外更改
    fi
done

echo ""
echo "🎉 修復完成！"
echo ""
echo "📋 修復摘要："
echo "✅ StyleManager.tsx - 修復 confirm 和 styled-components 錯誤"
echo "✅ EnhancedDashboard.tsx - 移除 loading 屬性和未使用 imports"
echo "✅ App.tsx - 移除未使用的 imports"
echo "✅ OverlayView.tsx - 修復 useEffect 依賴"
echo ""
echo "📁 原始檔案已備份到 ../backups/ 目錄"
echo ""
echo "🚀 下一步："
echo "1. 執行 'npm start' 重新啟動開發服務器"
echo "2. 檢查是否還有編譯錯誤"
echo "3. 如果有問題，可以從備份還原：cp ../backups/[檔名].bak src/[路徑]/[檔名]"
echo ""
echo "💡 如果修復後仍有錯誤，請重新啟動開發服務器："
echo "   Ctrl+C 停止服務器，然後再次執行 npm start"