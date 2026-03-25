"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";

const DARK_KEY = "briefly:darkMode";

export default function ProfilePage() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(DARK_KEY);
      setDark(v === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(DARK_KEY, dark ? "1" : "0");
    } catch {
      // ignore
    }
  }, [dark]);

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="mx-auto max-w-md px-4 pt-6">
        <div className="text-[18px] font-medium text-black">Profile</div>
        <div className="mt-1 text-[13px] text-[color:theme(colors.briefly.meta)]">
          Simple settings. No noise.
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <section className="rounded-2xl border border-[color:theme(colors.briefly.line)] bg-white">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-[14px] font-medium text-black">Dark mode</div>
              <div className="mt-1 text-[12.5px] text-[color:theme(colors.briefly.meta)]">
                Optional. (UI is currently light-first.)
              </div>
            </div>
            <button
              onClick={() => setDark((v) => !v)}
              className={[
                "h-8 w-14 rounded-full p-1 transition",
                dark
                  ? "bg-[color:theme(colors.briefly.accent)]"
                  : "bg-[color:theme(colors.briefly.muted)]"
              ].join(" ")}
              aria-label="Toggle dark mode"
            >
              <div
                className={[
                  "h-6 w-6 rounded-full bg-white shadow transition-transform",
                  dark ? "translate-x-6" : "translate-x-0"
                ].join(" ")}
              />
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-2xl bg-[color:theme(colors.briefly.muted)] p-5">
          <div className="text-[14px] font-medium text-black">About</div>
          <div className="mt-2 text-[13px] leading-relaxed text-[color:theme(colors.briefly.meta)]">
            Briefly is designed to be calm, factual, and respectful of your attention.
          </div>
          <div className="mt-4 text-[12.5px] text-[color:theme(colors.briefly.meta)]">
            Version: 0.1.0
          </div>
          <a
            href="#"
            className="mt-3 inline-block text-[12.5px] text-[color:theme(colors.briefly.meta)] underline decoration-[color:theme(colors.briefly.line)] underline-offset-4 hover:text-black"
          >
            Privacy
          </a>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

