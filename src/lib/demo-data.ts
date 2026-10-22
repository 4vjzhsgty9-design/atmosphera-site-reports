import { DailyReport, DemoState, Project } from "./models";
export const projects: Project[] = [
  {
    id: "villa-uma",
    name: "Villa Uma Residence",
    location: "Umalas, Bali",
    code: "ATM-001",
    manager: "Aditya Putra",
    package: "Structure & architecture",
  },
  {
    id: "canggu",
    name: "Canggu Coastal Retreat",
    location: "Canggu, Bali",
    code: "ATM-002",
    manager: "Made Wijaya",
    package: "Interior & finishing",
  },
  {
    id: "ubud",
    name: "Ubud Garden Villas",
    location: "Ubud, Bali",
    code: "ATM-003",
    manager: "Dewi Lestari",
    package: "Groundworks & structure",
  },
];
export function newReport(): DailyReport {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    projectId: projects[0].id,
    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    manager: "Aditya Putra",
    weather: "Sunny, 29°C",
    status: "Draft",
    revision: 1,
    manpower: [{ contractor: "", trade: "", count: 0 }],
    activities: [{ work: "", zone: "", description: "" }],
    quantities: [],
    photos: [],
    materials: "",
    equipment: "",
    issues: "",
    safety: "",
    tomorrow: "",
    comment: "",
    history: [],
  };
}
const base: DailyReport = {
  id: "dsr-001",
  projectId: "villa-uma",
  date: "2026-10-21",
  manager: "Aditya Putra",
  weather: "Partly cloudy, 29°C",
  status: "Approved",
  revision: 1,
  manpower: [
    { contractor: "Bali Structure", trade: "Concrete workers", count: 12 },
    { contractor: "Atmosphera", trade: "Masons", count: 8 },
    { contractor: "MEP Bali", trade: "Electricians", count: 4 },
  ],
  activities: [
    {
      work: "Concrete works",
      zone: "Level 01 · East wing",
      description:
        "Completed the first-floor slab pour and commenced curing. All test samples collected.",
    },
    {
      work: "Blockwork",
      zone: "Ground floor",
      description: "Internal partition walls completed in rooms 01–04.",
    },
  ],
  quantities: [
    { work: "Concrete slab", quantity: 32, unit: "m³" },
    { work: "Blockwork", quantity: 85, unit: "m²" },
  ],
  photos: [],
  materials: "Ready-mix concrete K-300: 32 m³ delivered and inspected.",
  equipment: "1 concrete pump; 2 concrete vibrators; 1 tower crane.",
  issues:
    "Afternoon rain interrupted external works for 45 minutes. No impact on critical path.",
  safety:
    "Toolbox talk completed. All personnel wearing required PPE. No incidents reported.",
  tomorrow:
    "Continue slab curing, inspect reinforcement in the west wing and start MEP first fix.",
  comment: "Work quantities checked against site records.",
  approvedBy: "Sarah Mitchell",
  history: [
    { at: "2026-10-21T09:00:00Z", action: "Submitted", by: "Aditya Putra" },
    { at: "2026-10-21T11:30:00Z", action: "Approved", by: "Sarah Mitchell" },
  ],
};
export const initialData: DemoState = {
  reports: [
    base,
    {
      ...base,
      id: "dsr-002",
      projectId: "canggu",
      manager: "Made Wijaya",
      status: "Submitted",
      approvedBy: undefined,
      comment: "",
      history: [
        { at: "2026-10-21T10:00:00Z", action: "Submitted", by: "Made Wijaya" },
      ],
    },
    {
      ...base,
      id: "dsr-003",
      projectId: "ubud",
      manager: "Dewi Lestari",
      date: "2026-10-20",
      status: "Revision Required",
      approvedBy: undefined,
      comment:
        "Please clarify the delivered quantities and tomorrow’s excavation plan.",
      history: [
        {
          at: "2026-10-20T10:00:00Z",
          action: "Revision requested",
          by: "Sarah Mitchell",
        },
      ],
    },
  ],
  monthly: projects.map((p, i) => ({
    projectId: p.id,
    month: "2026-10",
    planned: 62,
    actual: 58 - i * 8,
    packages: [
      { name: "Structure", planned: 90, actual: 86 },
      { name: "Architecture", planned: 55, actual: 48 },
      { name: "MEP", planned: 35, actual: 30 },
    ],
    curve: [
      { month: "Jun", planned: 5, actual: 4 },
      { month: "Jul", planned: 16, actual: 14 },
      { month: "Aug", planned: 30, actual: 28 },
      { month: "Sep", planned: 46, actual: 43 },
      { month: "Oct", planned: 62, actual: 58 - i * 8 },
      { month: "Nov", planned: 78, actual: null },
      { month: "Dec", planned: 92, actual: null },
      { month: "Jan", planned: 100, actual: null },
    ],
    summary:
      "Structural works progressed across the east wing. The team is prioritising MEP coordination and closing remaining design queries.",
    milestones:
      "First-floor slab completed · 21 October\nRoof structure target · 20 November",
    delays:
      "Material lead times and intermittent rain affected external works.",
    corrective:
      "Resequence external works and confirm procurement dates with suppliers.",
    forecast: "2027-01-31",
    nextPlan:
      "Complete roof structure, advance internal partitions and MEP first fix.",
    confirmed: false,
    status: "Draft",
  })),
};
export const projectName = (id: string) =>
  projects.find((p) => p.id === id)?.name ?? "Unknown project";
export const workforce = (r: DailyReport) =>
  r.manpower.reduce((n, row) => n + row.count, 0);
export const displayDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
