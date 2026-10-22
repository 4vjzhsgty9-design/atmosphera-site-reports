import { notFound } from "next/navigation";
import { WorkspaceGateway } from "@/components/workspace-gateway";
import { Suspense } from "react";
type Props = { params: Promise<{ slug: string[] }> };
export default function Page({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="empty" role="status">
          Loading workspace…
        </div>
      }
    >
      <ResolvedPage params={params} />
    </Suspense>
  );
}
async function ResolvedPage({ params }: Props) {
  const { slug } = await params;
  const screen = slug.join("/");
  if (
    !/^(projects|daily-reports|approvals|monthly-progress|monthly-builder|monthly-preview|archive|settings|daily-reports\/new|daily-reports\/[a-zA-Z0-9-]+|preview\/[a-zA-Z0-9-]+)$/.test(
      screen,
    )
  )
    notFound();
  return <WorkspaceGateway screen={screen} />;
}
