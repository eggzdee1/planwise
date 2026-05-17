"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TbListDetails, TbMessageDots, TbCornerUpLeft, TbSettings } from "react-icons/tb";
import type { IconType } from "react-icons";
import BacklogTab from "./backlog-tab";
import UpdatesTab from "./updates-tab";

type Tab = "backlog" | "updates" | "retrospective" | "settings";

const TABS: { id: Tab; label: string; Icon: IconType }[] = [
  { id: "backlog",       label: "Backlog",       Icon: TbListDetails },
  { id: "updates",      label: "Updates",      Icon: TbMessageDots },
  { id: "retrospective", label: "Retrospective", Icon: TbCornerUpLeft },
  { id: "settings",     label: "Settings",     Icon: TbSettings },
];

const isTab = (value: string | null): value is Tab =>
  value === "backlog" || value === "updates" || value === "retrospective" || value === "settings";

type Props = {
  projectId: string;
  currentUser: { id: string; name: string | null };
};

export default function ProjectTabs({ projectId, currentUser }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: Tab = isTab(tabParam) ? tabParam : "backlog";
  const searchParamsString = searchParams.toString();

  const handleTabChange = (tab: Tab) => {
    const params = new URLSearchParams(searchParamsString);
    if (tab === "backlog") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex border-b border-slate-300">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-base font-medium transition-colors ${
              activeTab === tab.id
                ? "-mb-px border-x border-slate-300 bg-slate-100 text-slate-900"
                : "border-x border-slate-200 bg-slate-200 text-slate-500 hover:bg-slate-300 hover:border-slate-300"
            }`}
          >
            <tab.Icon className="h-[1.1em] w-[1.1em] shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>
      <div className={`flex-1 overflow-auto bg-slate-100 ${activeTab !== "backlog" ? "p-6" : ""}`}>
        <div className={activeTab === "backlog" ? "block" : "hidden"}>
          <BacklogTab projectId={projectId} currentUser={currentUser} />
        </div>
        <div className={activeTab === "updates" ? "block h-full" : "hidden"}>
          <UpdatesTab projectId={projectId} />
        </div>
        {(activeTab === "retrospective" || activeTab === "settings") && (
          <p className="text-slate-500">{TABS.find((t) => t.id === activeTab)?.label}</p>
        )}
      </div>
    </div>
  );
}
