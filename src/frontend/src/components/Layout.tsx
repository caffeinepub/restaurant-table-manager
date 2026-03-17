import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CalendarDays,
  ChefHat,
  LayoutGrid,
  LogOut,
  UtensilsCrossed,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppPage } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LayoutProps {
  children: ReactNode;
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

const navItems: {
  page: AppPage;
  label: string;
  icon: React.ElementType;
  ocid: string;
}[] = [
  { page: "oggi", label: "Oggi", icon: LayoutGrid, ocid: "nav.oggi.link" },
  {
    page: "piantina",
    label: "Piantina",
    icon: UtensilsCrossed,
    ocid: "nav.piantina.link",
  },
  {
    page: "prenotazioni",
    label: "Prenotazioni",
    icon: CalendarDays,
    ocid: "nav.prenotazioni.link",
  },
];

export default function Layout({
  children,
  currentPage,
  onNavigate,
}: LayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-3)}`
    : "";

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-sidebar flex flex-col shrink-0">
        <div className="px-6 py-8 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-sidebar-foreground leading-tight">
                Tavola
              </h1>
              <p className="text-xs text-sidebar-foreground/50">
                Gestione Ristorante
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ page, label, icon: Icon, ocid }) => (
            <button
              type="button"
              key={page}
              data-ocid={ocid}
              onClick={() => onNavigate(page)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                currentPage === page
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-sidebar-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-sidebar-foreground/50 truncate">
                {shortPrincipal}
              </p>
            </div>
          </div>
          <Button
            data-ocid="nav.logout.button"
            variant="ghost"
            size="sm"
            onClick={clear}
            className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Esci
          </Button>
        </div>

        <div className="px-6 py-3 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/30 text-center">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-sidebar-foreground/50"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </div>
  );
}
