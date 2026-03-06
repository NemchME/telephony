type Props = {
  activeTab: 'users' | 'history';
  onChange: (tab: 'users' | 'history') => void;
};

export function TabBar({ activeTab, onChange }: Props) {
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
      </div>
    </div>
  );
}
