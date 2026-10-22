import { DemoState, ReportRepository } from "./models";
const KEY = "atmosphera-demo-v1";
// Replace this adapter with Supabase; production authorisation must use database RLS.
export const browserRepository: ReportRepository = {
  load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as DemoState;
    if (!Array.isArray(state.reports) || !Array.isArray(state.monthly))
      throw new Error("Invalid saved demo data");
    return state;
  },
  save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  },
};
