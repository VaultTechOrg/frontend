import { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { AuthHeader } from "@/components/AuthHeader";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/onboarding", label: "Onboarding" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/history", label: "History" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900">Stock Picker</h1>
            </Link>
            <div className="flex items-center gap-4">
              <p className="text-xs text-slate-500 hidden sm:block">Decision Support Only</p>
              <AuthHeader />
            </div>
          </div>

          <nav className="flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium pb-2 transition-colors ${
                  isActive(item.path)
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-slate-600 hover:text-slate-900 border-b-2 border-transparent"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs text-slate-600">
            <strong>Disclaimer:</strong> Stock Picker provides decision support only and is not financial advice. Always conduct your own research and consult with a qualified financial advisor before making investment decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
