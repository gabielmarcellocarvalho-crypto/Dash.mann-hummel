import { NextResponse } from "next/server";
import { fetchMetaAdsCreatives } from "@/lib/platforms/meta-ads";

export async function GET() {
  try {
    const creatives = await fetchMetaAdsCreatives();
    return NextResponse.json({ creatives });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar criativos do Meta Ads";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
