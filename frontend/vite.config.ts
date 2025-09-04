import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.NEXT_PUBLIC_ESCROW_PACKAGE_ID': JSON.stringify(env.NEXT_PUBLIC_ESCROW_PACKAGE_ID),
        'process.env.NEXT_PUBLIC_VAULT_CREATION_CAP_ID': JSON.stringify(env.NEXT_PUBLIC_VAULT_CREATION_CAP_ID),
        'process.env.NEXT_PUBLIC_SUI_NETWORK': JSON.stringify(env.NEXT_PUBLIC_SUI_NETWORK),
        'process.env.NEXT_PUBLIC_SUI_RPC_URL': JSON.stringify(env.NEXT_PUBLIC_SUI_RPC_URL),
        'process.env.NEXT_PUBLIC_DEFAULT_GAS_BUDGET': JSON.stringify(env.NEXT_PUBLIC_DEFAULT_GAS_BUDGET),
        'process.env.NEXT_PUBLIC_APP_NAME': JSON.stringify(env.NEXT_PUBLIC_APP_NAME),
        'process.env.NEXT_PUBLIC_APP_VERSION': JSON.stringify(env.NEXT_PUBLIC_APP_VERSION),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
        dedupe: ['react', 'react-dom'],
      },
      optimizeDeps: {
        include: ['react', 'react-dom', '@tanstack/react-query'],
      },
    };
});
