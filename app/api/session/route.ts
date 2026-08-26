import { NextResponse } from "next/server";
import { getAccess } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getAccess();
  return NextResponse.json(access);
}
