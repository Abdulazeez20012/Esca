
import React from 'react';
import { HashRouter, Routes, Route, Outlet, NavLink, useLocation } from 'react-router-dom';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SplashScreen from './src/pages/SplashScreen';
import Dashboard from './src/pages/Dashboard';
import LockAsset from './src/pages/LockAsset';
import MyEscrows from './src/pages/MyEscrows';
import SwapStatus from './src/pages/SwapStatus';
import TransactionHistory from './src/pages/TransactionHistory';
import Header from './src/components/Header';
import { LayoutDashboard, Lock, ArrowLeftRight, History } from 'lucide-react';

const AppLayout: React.FC = () => {
    const location = useLocation();
    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/lock', label: 'Lock Asset', icon: Lock },
        { path: '/escrows', label: 'My Escrows', icon: ArrowLeftRight },
        { path: '/history', label: 'History', icon: History },
    ];

    return (
        <div className="min-h-screen bg-black font-sans">
            <Header />
            <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-8">
                    <nav className="lg:w-1/5">
                         <div className="p-4 rounded-lg bg-black/30 border border-gray-800 backdrop-blur-sm">
                            <ul className="space-y-2">
                                {navItems.map(item => (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-300 ease-in-out ${
                                                isActive
                                                    ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30 shadow-[0_0_15px_rgba(219,39,119,0.3)]'
                                                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                                }`
                                            }
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span>{item.label}</span>
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </nav>
                    <div className="flex-1">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

const queryClient = new QueryClient();
const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="devnet">
        <WalletProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<SplashScreen />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/lock" element={<LockAsset />} />
                <Route path="/escrows" element={<MyEscrows />} />
                <Route path="/escrows/:id" element={<SwapStatus />} />
                <Route path="/history" element={<TransactionHistory />} />
              </Route>
            </Routes>
          </HashRouter>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};

export default App;