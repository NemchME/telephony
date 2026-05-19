export type MainTab = 'users' | 'history' | 'crm';

type Props = {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
  missedCount?: number;
  showCrmTab?: boolean;
};

export function TabBar({ activeTab, onChange, missedCount = 0, showCrmTab = false }: Props) {
  return (
    <div className="tab-bar">
      <div
        className={`tab ${activeTab === 'users' ? 'active' : ''}`}
        onClick={() => onChange('users')}
      >
        Пользователи
      </div>
      <div
        className={`tab ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onChange('history')}
      >
        История звонков
        {missedCount > 0 && <span className="tab-badge">{missedCount}</span>}
      </div>
      {showCrmTab && (
        <div
          className={`tab ${activeTab === 'crm' ? 'active' : ''}`}
          onClick={() => onChange('crm')}
        >
          CRM
        </div>
      )}
    </div>
  );
}
