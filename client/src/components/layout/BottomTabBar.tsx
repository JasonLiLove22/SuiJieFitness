import { NavLink, useLocation } from 'react-router-dom';
import { Dumbbell, Footprints, Bike, CalendarDays, User } from 'lucide-react';

const tabs = [
  { to: '/', label: '训练', icon: Dumbbell },
  { to: '/running', label: '跑步&骑行', icons: [Footprints, Bike] },
  { to: '/history', label: '记录', icon: CalendarDays },
  { to: '/profile', label: '我的', icon: User },
];

export default function BottomTabBar() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
            >
              {'icons' in tab && tab.icons ? (
                <div className="flex gap-1">
                  {tab.icons.map((Icon, i) => (
                    <Icon key={i} size={16} strokeWidth={2} className={isActive ? 'text-primary' : 'text-gray-400'} />
                  ))}
                </div>
              ) : 'icon' in tab && tab.icon ? (
                <tab.icon size={22} strokeWidth={2} className={isActive ? 'text-primary' : 'text-gray-400'} />
              ) : null}
              <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
