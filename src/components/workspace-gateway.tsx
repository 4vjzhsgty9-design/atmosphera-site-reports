import { connection } from "next/server";
import { appMode, supabaseConfig } from "@/lib/auth/config";
import { Workspace } from "./workspace";
import { ConnectedWorkspace } from "./auth/connected-workspace";
import { ConfigurationNeeded } from "./auth/configuration";
export async function WorkspaceGateway({ screen }: { screen: string }) {
  await connection();
  if (appMode() === "demo") return <Workspace screen={screen} />;
  if (!supabaseConfig()) return <ConfigurationNeeded />;
  return <ConnectedWorkspace screen={screen} />;
}
