
import { Sun, Wind } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { label: "Weather", path: "/", icon: Sun },
  { label: "Settings", path: "/settings", icon: Wind },
];

export default function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-200 flex justify-around h-16 z-30 shadow-sm">
      {tabs.map(tab => {
        const selected = pathname === tab.path || (tab.path === "/" && pathname === "");
        const Icon = tab.icon;
        return (
          <Link 
            to={tab.path} 
            key={tab.path}
            className={`flex flex-col items-center justify-center flex-1 transition-all ${selected ? "tab-selected" : "tab-inactive"} hover:bg-pink-50`}
          >
            <Icon size={24} className="mb-1" />
            <span className="text-xs">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  );
}
