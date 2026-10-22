"use client";
import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";
import { initialData } from "@/lib/demo-data";
import { demoStore } from "@/lib/demo-store";
import { DailyReport, DemoState, MonthlyProgress, Role } from "@/lib/models";
type Context = {
  data: DemoState;
  role: Role;
  setRole: (role: Role) => void;
  ready: boolean;
  storageError: string;
  upsertReport: (report: DailyReport) => void;
  upsertMonthly: (report: MonthlyProgress) => void;
  reset: () => void;
};
const DemoContext = createContext<Context | null>(null);
const upsertReport = (report: DailyReport) =>
  demoStore.update((old) => ({
    ...old,
    reports: old.reports.some((r) => r.id === report.id)
      ? old.reports.map((r) => (r.id === report.id ? report : r))
      : [report, ...old.reports],
  }));
const upsertMonthly = (report: MonthlyProgress) =>
  demoStore.update((old) => ({
    ...old,
    monthly: old.monthly.some(
      (r) => r.projectId === report.projectId && r.month === report.month,
    )
      ? old.monthly.map((r) =>
          r.projectId === report.projectId && r.month === report.month
            ? report
            : r,
        )
      : [...old.monthly, report],
  }));
const reset = () => demoStore.update(() => structuredClone(initialData));
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(
    demoStore.subscribe,
    demoStore.getSnapshot,
    demoStore.getServerSnapshot,
  );
  const [role, setRole] = useState<Role>("Project Manager");
  return (
    <DemoContext.Provider
      value={{ ...snapshot, role, setRole, upsertReport, upsertMonthly, reset }}
    >
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("Missing DemoProvider");
  return context;
}
