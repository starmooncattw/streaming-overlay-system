import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 路徑別名設定
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/assets': path.resolve(__dirname, './src/assets')
    }
  },

  // 開發伺服器設定
  server: {
    port: 3000,
    host: true, // 允許外部存取
    proxy: {
      // 開發時將 API 請求代理到後端
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        timeout: 60000
      }
    }
  },

  // 預覽伺服器設定
  preview: {
    port: 3000,
    host: true
  },

  // 建置設定
  build: {
    outDir: 'dist',
    sourcemap: true,
    // 提高 chunk 大小警告閾值
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 手動分割代碼塊
        manualChunks: {
          // React 相關
          'react-vendor': ['react', 'react-dom'],
          // React Router
          'router': ['react-router-dom'],
          // UI 組件庫
          'ui-vendor': [
            'framer-motion', 
            '@headlessui/react', 
            '@heroicons/react',
            'react-color',
            'react-select'
          ],
          // Firebase
          'firebase': ['firebase/app', 'firebase/auth'],
          // Socket.io
          'socket': ['socket.io-client'],
          // 其他工具庫
          'utils': ['axios', 'date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    // 最小化設定
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生產環境移除 console
        drop_debugger: true
      }
    }
  },

  // CSS 設定
  css: {
    devSourcemap: true,
    // PostCSS 會自動載入 postcss.config.js
  },

  // 環境變數設定
  envPrefix: 'VITE_',

  // 靜態資源處理
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],

  // 最佳化依賴
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-query',
      'axios',
      'socket.io-client',
      'framer-motion',
      'react-hot-toast',
      'react-i18next',
      'i18next',
      'firebase/app',
      'firebase/auth'
    ],
    exclude: [
      // 排除某些不需要預構建的依賴
    ]
  },

  // 定義全域常數
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // ESBuild 設定
  esbuild: {
    // 移除生產環境的 console 和 debugger
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})