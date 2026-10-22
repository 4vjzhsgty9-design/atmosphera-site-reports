"use client";
import { useActionState } from "react";
import {
  archiveProject,
  inviteEmployee,
  saveEmployee,
  saveProject,
  setMembership,
} from "@/lib/auth/admin-actions";
import { employeeRoles, roleLabels, type Employee } from "@/lib/auth/roles";
import type { AuthResult } from "@/lib/auth/actions";
export type ConnectedProject = {
  id: string;
  code: string;
  name: string;
  location: string;
  archived_at: string | null;
};
function Submit({
  pending,
  message,
  label,
}: {
  pending: boolean;
  message: string;
  label: string;
}) {
  return (
    <>
      {message && (
        <p className="notice compact" role="status">
          {message}
        </p>
      )}
      <button disabled={pending} className="button primary">
        {pending ? "Saving…" : label}
      </button>
    </>
  );
}
function RoleSelect({ value }: { value?: string }) {
  return (
    <label className="field">
      <span>Role</span>
      <select name="role" defaultValue={value ?? "site_manager"}>
        {employeeRoles.map((role) => (
          <option key={role} value={role}>
            {roleLabels[role]}
          </option>
        ))}
      </select>
    </label>
  );
}
export function ProjectForm({ project }: { project?: ConnectedProject }) {
  const [state, action, pending] = useActionState(saveProject, {
    message: "",
  } as AuthResult);
  return (
    <form action={action} className="row-list">
      <input type="hidden" name="id" value={project?.id ?? ""} />
      <label className="field">
        <span>Project code</span>
        <input
          name="code"
          required
          maxLength={40}
          defaultValue={project?.code}
        />
      </label>
      <label className="field">
        <span>Project name</span>
        <input
          name="name"
          required
          maxLength={160}
          defaultValue={project?.name}
        />
      </label>
      <label className="field">
        <span>Location</span>
        <input
          name="location"
          maxLength={200}
          defaultValue={project?.location}
        />
      </label>
      <Submit
        pending={pending}
        message={state.message}
        label={project ? "Save changes" : "Create project"}
      />
    </form>
  );
}
export function ArchiveForm({ project }: { project: ConnectedProject }) {
  const [state, action, pending] = useActionState(archiveProject, {
    message: "",
  });
  return (
    <form action={action} className="row-list mt-4">
      <input type="hidden" name="id" value={project.id} />
      <input
        type="hidden"
        name="archived"
        value={project.archived_at ? "false" : "true"}
      />
      <Submit
        pending={pending}
        message={state.message}
        label={project.archived_at ? "Restore project" : "Archive project"}
      />
    </form>
  );
}
export function InviteForm() {
  const [state, action, pending] = useActionState(inviteEmployee, {
    message: "",
  });
  return (
    <form action={action} className="row-list">
      <label className="field">
        <span>Test employee name</span>
        <input name="name" required maxLength={120} />
      </label>
      <label className="field">
        <span>Test employee email</span>
        <input name="email" type="email" required maxLength={254} />
      </label>
      <RoleSelect />
      <Submit
        pending={pending}
        message={state.message}
        label="Invite employee"
      />
    </form>
  );
}
export function EmployeeForm({ employee }: { employee: Employee }) {
  const [state, action, pending] = useActionState(saveEmployee, {
    message: "",
  });
  return (
    <form action={action} className="row-list">
      <input type="hidden" name="id" value={employee.id} />
      <label className="field">
        <span>Display name</span>
        <input
          name="name"
          defaultValue={employee.display_name}
          required
          maxLength={120}
        />
      </label>
      <RoleSelect value={employee.role} />
      <label className="field">
        <span>Access</span>
        <select name="active" defaultValue={String(employee.active)}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </label>
      <Submit
        pending={pending}
        message={state.message}
        label="Update employee"
      />
    </form>
  );
}
export function MembershipForm({
  projects,
  employees,
}: {
  projects: ConnectedProject[];
  employees: Employee[];
}) {
  const [state, action, pending] = useActionState(setMembership, {
    message: "",
  });
  return (
    <form action={action} className="row-list">
      <label className="field">
        <span>Project</span>
        <select name="project" required defaultValue="">
          <option value="" disabled>
            Select project
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.archived_at ? " (archived)" : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Employee</span>
        <select name="employee" required defaultValue="">
          <option value="" disabled>
            Select employee
          </option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.display_name}
              {e.active ? "" : " (inactive)"}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Action</span>
        <select name="assigned">
          <option value="true">Assign to project</option>
          <option value="false">Remove assignment</option>
        </select>
      </label>
      <Submit
        pending={pending}
        message={state.message}
        label="Update assignment"
      />
    </form>
  );
}

export function ProvisionForm() {
  const [state, action, pending] = useActionState(saveEmployee, {
    message: "",
  });
  return (
    <form action={action} className="row-list">
      <label className="field">
        <span>Existing test Auth user UUID</span>
        <input name="id" required pattern="[0-9a-fA-F-]{36}" />
      </label>
      <label className="field">
        <span>Test display name</span>
        <input name="name" required maxLength={120} />
      </label>
      <RoleSelect />
      <input type="hidden" name="active" value="true" />
      <Submit
        pending={pending}
        message={state.message}
        label="Provision existing account"
      />
    </form>
  );
}
