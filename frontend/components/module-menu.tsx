"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MenuItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface ModuleMenuProps {
  items: MenuItem[];
  title: string;
  icon?: React.ReactNode;
  href?: string;
}

export function ModuleMenu({ items, title, icon, href }: ModuleMenuProps) {
  const pathname = usePathname();

  const titleContent = (
    <div className="flex items-center">
      {icon && <span className="mr-2 text-gray-700">{icon}</span>}
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
  );

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14">
          <div className="mr-8 min-w-[120px]">
            {href ? (
              <Link 
                href={href}
                className="flex items-center hover:text-blue-600 transition-colors cursor-pointer"
              >
                {titleContent}
              </Link>
            ) : (
              titleContent
            )}
          </div>
          <nav className="flex space-x-2">
            {items.map((item) => {
              // Lấy URL gốc (không có query params) để so sánh
              const basePathname = pathname?.split("?")[0] || "";
              const baseHref = item.href.split("?")[0];
              const isActive = basePathname === baseHref || basePathname?.startsWith(baseHref + "/");
              
              return (
                <Link
                  key={item.href}
                  href={baseHref}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center",
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  {item.icon && <span className={cn("mr-2", isActive ? "text-white" : "text-gray-500")}>{item.icon}</span>}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

