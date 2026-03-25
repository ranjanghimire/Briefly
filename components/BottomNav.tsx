"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, User } from "lucide-react";

type Item = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const items: Item[] = [
  { href: "/feed", label: "Feed", Icon: Home },
  { href: "/topics", label: "Topics", Icon: Layers },
  { href: "/profile", label: "Profile", Icon: User }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[color:var(--briefly-line)] bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 py-3">
        {items.map(({ href, label, Icon }) => {
          const onFeedBranch =
            pathname === "/feed" || pathname?.startsWith("/topic/");
          const active =
            href === "/feed"
              ? onFeedBranch
              : pathname === href || pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex w-20 flex-col items-center gap-1 rounded-xl py-2 text-xs transition",
                active
                  ? "text-black"
                  : "text-[color:theme(colors.briefly.meta)] hover:text-black"
              ].join(" ")}
            >
              <Icon className={active ? "h-5 w-5" : "h-5 w-5 opacity-80"} />
              <span className={active ? "font-medium" : ""}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

