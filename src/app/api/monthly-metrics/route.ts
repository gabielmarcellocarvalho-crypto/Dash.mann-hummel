import { NextRequest, NextResponse } from "next/server";
import { fetchMonthlyMetrics } from "@/lib/monthly-metrics-store";
import type { ChannelId } from "@/lib/platforms/types";

const VALID_CHANNELS: ChannelId[] = ["meli", "google", "amazon", "meta"];

export async function GET(request: NextRequest) {
  const channelId = request.nextUrl.searchParams.get("channel") as ChannelId | null;
  if (!channelId || !VALID_CHANNELS.includes(channelId)) {
    return NextResponse.json({ error: "Parâmetro 'channel' inválido ou ausente" }, { status: 400 });
  }

  try {
    const months = await fetchMonthlyMetrics(channelId);
    return NextResponse.json({ channelId, months });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar métricas mensais";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
