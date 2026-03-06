import { useState } from 'react';
import { useBootstrap } from '@/features/boot/model/useBootstrap';
import { Header } from '@/shared/ui/layout/Header';
import { CallQueueSidebar } from '@/shared/ui/layout/CallQueueSidebar';
import { ActiveCallsTable } from './ui/ActiveCallsTable';
import { TabBar } from './ui/TabBar';
import { UsersPanel } from './ui/UsersPanel';
import { CallHistoryPanel } from './ui/CallHistoryPanel';

export function MainPage() {
  const booted = useBootstrap();
  const [activeTab, setActiveTab] = useState<'users' | 'history'>('users');

  if (!booted) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="main-layout">
      <Header />
      <div className="main-body">
        <CallQueueSidebar />
        <div className="main-content">
          <ActiveCallsTable />
          <TabBar activeTab={activeTab} onChange={setActiveTab} />
          <div className="tab-content">
            {activeTab === 'users' ? <UsersPanel /> : <CallHistoryPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
