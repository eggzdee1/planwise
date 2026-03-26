"use client";

import { useState } from "react";
import { TbListDetails, TbMessageDots, TbCornerUpLeft, TbSettings } from "react-icons/tb";
import type { IconType } from "react-icons";

type Tab = "backlog" | "updates" | "retrospective" | "settings";

const TABS: { id: Tab; label: string; Icon: IconType }[] = [
  { id: "backlog",       label: "Backlog",       Icon: TbListDetails },
  { id: "updates",      label: "Updates",      Icon: TbMessageDots },
  { id: "retrospective", label: "Retrospective", Icon: TbCornerUpLeft },
  { id: "settings",     label: "Settings",     Icon: TbSettings },
];

export default function ProjectTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("backlog");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex border-b border-slate-300">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-base font-medium transition-colors ${
              activeTab === tab.id
                ? "-mb-px border-x border-slate-300 bg-white text-slate-900"
                : "border-x border-slate-100 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:border-slate-200"
            }`}
          >
            <tab.Icon className="h-[1.1em] w-[1.1em] shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto bg-white p-6">
        <p className="text-slate-500">
          {TABS.find((t) => t.id === activeTab)?.label}
        </p>
      </div>
    </div>
  );
}
