import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Payload = {
  link_id?: string;
  profile_id?: string;
  referrer?: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { link_id, profile_id, referrer } = payload;
  if (!profile_id || !UUID_RE.test(profile_id)) {
    return NextResponse.json({ error: "Bad profile_id" }, { status: 400 });
  }
  if (link_id && !UUID_RE.test(link_id)) {
    return NextResponse.json({ error: "Bad link_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clicks").insert({
    link_id: link_id ?? null,
    profile_id,
    referrer: referrer ? referrer.slice(0, 512) : null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
