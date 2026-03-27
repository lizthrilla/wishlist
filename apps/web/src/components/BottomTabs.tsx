export type AppTab = 'wishlist' | 'feed' | 'families';

interface BottomTabsProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string }[] = [
  { id: 'wishlist', label: 'My Wishlist' },
  { id: 'feed', label: 'Feed' },
  { id: 'families', label: 'Families' },
];

export default function BottomTabs({ activeTab, onChange }: BottomTabsProps) {
  return (
    <nav className="bottom-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button${activeTab === tab.id ? ' tab-button--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
