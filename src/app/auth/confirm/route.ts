import { NextResponse, type NextRequest } from "next/server";
import { appMode, supabaseConfig } from "@/lib/auth/config";
import { serverSupabase } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const config = supabaseConfig();
  if (appMode() !== "connected" || !config)
    return new NextResponse("Authentication is not configured.", {
      status: 503,
    });
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  if (token_hash && (type === "invite" || type === "recovery")) {
    const client = await serverSupabase();
    const { error } = await client.auth.verifyOtp({ token_hash, type });
    if (!error)
      return NextResponse.redirect(new URL("/auth/password", config.origin), {
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      });
  }
  return NextResponse.redirect(
    new URL("/login?notice=expired", config.origin),
    {
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}
