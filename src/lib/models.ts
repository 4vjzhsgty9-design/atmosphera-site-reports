export type Role = "Site Manager" | "Project Manager" | "Director / Admin";
export type Status = "Draft" | "Submitted" | "Revision Required" | "Approved";
export type Photo = {
  id: string;
  src: string;
  caption: string;
  activity: string;
};
export type DailyReport = {
  id: string;
  projectId: string;
  date: string;
  manager: string;
  weather: string;
  status: Status;
  revision: number;
  previousId?: string;
  manpower: { contractor: string; trade: string; count: number }[];
  activities: { work: string; zone: string; description: string }[];
  quantities: { work: string; quantity: number; unit: string }[];
  photos: Photo[];
  materials: string;
  equipment: string;
  issues: string;
  safety: string;
  tomorrow: string;
  comment: string;
  approvedBy?: string;
  history: { at: string; action: string; by: string }[];
};
export type Project = {
  id: string;
  name: string;
  location: string;
  code: string;
  manager: string;
  package: string;
};
export type MonthlyProgress = {
  projectId: string;
  month: string;
  planned: number;
  actual: number;
  packages: { name: string; planned: number; actual: number }[];
  curve: { month: string; planned: number; actual: number | null }[];
  summary: string;
  milestones: string;
  delays: string;
  corrective: string;
  forecast: string;
  nextPlan: string;
  confirmed: boolean;
  status: "Draft" | "Submitted" | "Approved";
  approvedBy?: string;
};
export type DemoState = { reports: DailyReport[]; monthly: MonthlyProgress[] };
export interface ReportRepository {
  load(): DemoState | null;
  save(state: DemoState): void;
}
