import { Suspense } from "react";
import { WorkspaceGateway } from "@/components/workspace-gateway";
export default function Home() {
  return (
    <Suspense fallback={<p className="empty">Loading workspace…</p>}>
      <WorkspaceGateway screen="dashboard" />
    </Suspense>
  );
}
