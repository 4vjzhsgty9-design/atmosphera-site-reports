export const employeeRoles = [
  "director_admin",
  "project_manager",
  "site_manager",
] as const;
export type EmployeeRole = (typeof employeeRoles)[number];
export const roleLabels: Record<EmployeeRole, string> = {
  director_admin: "Director / Admin",
  project_manager: "Project Manager",
  site_manager: "Site Manager",
};
export type Employee = {
  id: string;
  display_name: string;
  role: EmployeeRole;
  active: boolean;
};
export function isEmployee(value: unknown): value is Employee {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.display_name === "string" &&
    typeof p.active === "boolean" &&
    employeeRoles.includes(p.role as EmployeeRole)
  );
}
