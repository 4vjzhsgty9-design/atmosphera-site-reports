import Link from "next/link";
import { Status } from "@/lib/models";

const paths: Record<string, string> = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  building:
    "M4 21V7l8-4v18 M12 9h8v12 M2 21h20 M7 9h2 M7 13h2 M7 17h2 M15 13h2 M15 17h2",
  file: "M14 2H5v20h14V7z M14 2v6h5 M8 12h8 M8 16h8",
  check: "M5 12l4 4L19 6",
  chart: "M3 3v18h18 M7 15l4-5 4 2 5-7",
  archive: "M3 3h18v5H3z M5 8v13h14V8 M9 12h6",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2",
  plus: "M12 5v14 M5 12h14",
  arrow: "M4 12h16 M14 6l6 6-6 6",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  people:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-3a7 7 0 0 1 14 0v3 M17 4a4 4 0 0 1 0 7 M19 15a6 6 0 0 1 3 6",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2",
  camera: "M3 6h5l2-3h4l2 3h5v15H3z M12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
  download: "M12 3v12 M7 10l5 5 5-5 M3 16v5h18v-5",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  close: "M5 5l14 14 M19 5L5 19",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10 M12 1v3 M12 20v3 M1 12h3 M20 12h3 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2",
};
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.file} />
    </svg>
  );
}
export function Badge({ status }: { status: Status | string }) {
  return (
    <span
      className={`badge badge-${status.toLowerCase().replaceAll(" ", "-")}`}
    >
      <span />
      {status}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <Icon name="file" size={30} />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function ActionLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`button ${secondary ? "secondary" : "primary"}`}
    >
      {children}
      <Icon name="arrow" size={16} />
    </Link>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Section({
  number,
  title,
  description,
  children,
}: {
  number?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel form-section">
      <div className="section-title">
        {number && <span className="section-number">{number}</span>}
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
