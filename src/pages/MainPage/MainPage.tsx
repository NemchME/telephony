import { useState, useEffect } from 'react';
import { useBootstrap } from '@/features/boot/model/useBootstrap';
import { useAppSelector } from '@/app/store/hooks';
import { selectUserId } from '@/entities/session/model/sessionSelectors';
import { env } from '@/app/config/env';
import { Header } from '@/shared/ui/layout/Header';
import { CallQueueSidebar } from '@/shared/ui/layout/CallQueueSidebar';
import { ActiveCallsTable } from './ui/ActiveCallsTable';
import { TabBar } from './ui/TabBar';
import { UsersPanel } from './ui/UsersPanel';
import { CallHistoryPanel } from './ui/CallHistoryPanel';

function sendBusyStatusReset(userId: string) {
  const body = JSON.stringify({
    method: 'User.Update',
    filter: { id: userId },
    data: { busyStatus: '_' },
  });
  navigator.sendBeacon(env.API_URL, body);
}

export function MainPage() {
  const booted = useBootstrap();
  const [activeTab, setActiveTab] = useState<'users' | 'history'>('users');
  const userId = useAppSelector(selectUserId);

  useEffect(() => {
    if (!userId) return;
    const handler = () => sendBusyStatusReset(userId);
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [userId]);

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
