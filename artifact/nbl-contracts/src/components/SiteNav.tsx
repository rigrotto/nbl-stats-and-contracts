import { Link, useLocation } from "wouter";
import { useTheme } from "@/lib/useTheme";
import { Sun, Moon, BarChart2, TableProperties } from "lucide-react";

export default function SiteNav() {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  const links = [
    { href: "/", label: "Contracts", icon: TableProperties },
    { href: "/stats", label: "Player Stats", icon: BarChart2 },
  ];

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-11">
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </nav>
  );
}
