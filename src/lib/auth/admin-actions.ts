"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireEmployee } from "./session";
import { employeeRoles } from "./roles";
import { adminSupabase } from "@/lib/supabase/admin";
import { supabaseConfig } from "./config";
import type { AuthResult } from "./actions";
export async function saveProject(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const { client } = await requireEmployee(true);
  const parsed = z
    .object({
      id: z.union([z.uuid(), z.literal("")]),
      code: z.string().trim().min(1).max(40),
      name: z.string().trim().min(1).max(160),
      location: z.string().trim().max(200),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: "Check the project fields." };
  const p = parsed.data;
  const { error } = await client.rpc("save_project", {
    target: p.id || null,
    project_code: p.code,
    project_name: p.name,
    project_location: p.location,
  });
  if (error)
    return {
      message:
        "Project could not be saved. Check for a duplicate code or expired access.",
    };
  revalidatePath("/");
  return { ok: true, message: "Project saved." };
}
export async function archiveProject(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const { client } = await requireEmployee(true);
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return { message: "Invalid project." };
  const { error } = await client.rpc("archive_project", {
    target: id.data,
    archived: form.get("archived") === "true",
  });
  if (error) return { message: "Project archive status could not be changed." };
  revalidatePath("/");
  return {
    ok: true,
    message:
      "Project archive status updated. Historical records are preserved.",
  };
}
export async function setMembership(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const { client } = await requireEmployee(true);
  const parsed = z
    .object({
      project: z.uuid(),
      employee: z.uuid(),
      assigned: z.enum(["true", "false"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { message: "Select a project, employee and action." };
  const { project, employee, assigned } = parsed.data;
  const { error } = await client.rpc("set_membership", {
    target_project: project,
    target_user: employee,
    assigned: assigned === "true",
  });
  if (error)
    return {
      message:
        "Assignment could not be changed. Check that the employee is active.",
    };
  revalidatePath("/");
  return { ok: true, message: "Project assignment updated." };
}
export async function saveEmployee(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const { client } = await requireEmployee(true);
  const parsed = z
    .object({
      id: z.uuid(),
      name: z.string().trim().min(1).max(120),
      role: z.enum(employeeRoles),
      active: z.enum(["true", "false"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { message: "Check the employee fields." };
  const p = parsed.data;
  const { error } = await client.rpc("set_employee", {
    target: p.id,
    employee_name: p.name,
    employee_role: p.role,
    employee_active: p.active === "true",
  });
  if (error)
    return {
      message:
        "Employee could not be updated. The last active Director cannot be removed or demoted.",
    };
  revalidatePath("/");
  return { ok: true, message: "Employee access updated." };
}
export async function inviteEmployee(
  _previous: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  const { client } = await requireEmployee(true);
  const parsed = z
    .object({
      email: z.email().max(254),
      name: z.string().trim().min(1).max(120),
      role: z.enum(employeeRoles),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      message: "Enter an email, display name and one of the three roles.",
    };
  if (!process.env.SUPABASE_SECRET_KEY)
    return {
      message:
        "Account invitation requires a server-only Supabase secret. Follow the setup guide.",
    };
  const config = supabaseConfig()!;
  let result;
  try {
    result = await adminSupabase().auth.admin.inviteUserByEmail(
      parsed.data.email,
      { redirectTo: `${config.origin}/auth/confirm` },
    );
  } catch {
    return {
      message: "The invitation service is unavailable. No access was granted.",
    };
  }
  if (result.error || !result.data.user)
    return {
      message:
        "Invitation could not be sent. Check email configuration and whether the account already exists.",
    };
  const { error } = await client.rpc("set_employee", {
    target: result.data.user.id,
    employee_name: parsed.data.name,
    employee_role: parsed.data.role,
    employee_active: true,
  });
  if (error)
    return {
      message:
        "The invitation was created, but employee access was not provisioned. The account has no application access. Ask the administrator to provision its Auth user ID using the setup guide.",
    };
  revalidatePath("/");
  return {
    ok: true,
    message:
      "Employee invited. Assign projects below. Do not use real employee data during Stage 1 testing.",
  };
}
