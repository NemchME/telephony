import { useState, useEffect } from 'react';
import { useBootstrap } from '@/features/boot/model/useBootstrap';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { selectUserId } from '@/entities/session/model/sessionSelectors';
import { env } from '@/app/config/env';
import { Header } from '@/shared/ui/layout/Header';
import { CallQueueSidebar } from '@/shared/ui/layout/CallQueueSidebar';
import { ActiveCallsTable } from './ui/ActiveCallsTable';
import { TabBar, type MainTab } from './ui/TabBar';
import { UsersPanel } from './ui/UsersPanel';
import { CallHistoryPanel } from './ui/CallHistoryPanel';
import { markSeen, bindToUser } from '@/entities/missedCalls/model/missedCallsSlice';
import { CrmPanel } from './ui/CrmPanel';
import { useFaviconSync } from '@/shared/lib/favicon/useFaviconSync';
import { useMissedCallsTitleSync } from '@/shared/lib/title/useMissedCallsTitleSync';
import { ensureNotificationPermission } from '@/shared/lib/notifications/notifications';
import { useSessionKeepalive } from '@/shared/lib/session/useSessionKeepalive';
import { useServerSettingsSync } from '@/entities/userSettings/model/useServerSettingsSync';

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
  const [activeTab, setActiveTab] = useState<MainTab>('users');
  const userId = useAppSelector(selectUserId);
  const dispatch = useAppDispatch();
  const missedCount = useAppSelector((s) => s.missedCalls.unseenCount);
  const crmList = useAppSelector((s) => s.crm.available);
  const crmActivateTick = useAppSelector((s) => s.crm.activateTick);

  useFaviconSync();
  useMissedCallsTitleSync();
  useSessionKeepalive();
  useServerSettingsSync();

  useEffect(() => {
    if (userId) void ensureNotificationPermission();
  }, [userId]);

  useEffect(() => {
    dispatch(bindToUser(userId ?? null));
  }, [userId, dispatch]);

  useEffect(() => {
    if (crmActivateTick > 0 && crmList.length > 0) {
      setActiveTab('crm');
    }
  }, [crmActivateTick, crmList.length]);

  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      dispatch(markSeen());
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && missedCount > 0) {
      dispatch(markSeen());
    }
  }, [activeTab, missedCount, dispatch]);

  useEffect(() => {
    if (!userId) return;
    const handler = (e: BeforeUnloadEvent) => {
      sendBusyStatusReset(userId);
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
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
          <TabBar
            activeTab={activeTab}
            onChange={handleTabChange}
            missedCount={missedCount}
            showCrmTab={crmList.length > 0}
          />
          <div className="tab-content">
            {activeTab === 'users' && <UsersPanel />}
            {activeTab === 'history' && <CallHistoryPanel />}
            {activeTab === 'crm' && <CrmPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}