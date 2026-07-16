import type { InstagramPost } from "@/data/mock-dashboard";
import { Badge } from "./Badge";

export function PostsTable({ posts }: { posts: InstagramPost[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr className="border-b border-border">
            {["Post", "Formato", "Visualizações", "Curtidas", "Comentários"].map((h, i) => (
              <th
                key={h}
                className={`whitespace-nowrap pb-2.5 text-[10.5px] font-bold uppercase tracking-wider text-text-3 ${
                  i === 0 ? "text-left" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.legenda} className="border-b border-border/60 last:border-0">
              <td className="max-w-[220px] truncate py-2.5 text-[13px] font-medium text-text-1">{p.legenda}</td>
              <td className="py-2.5 text-right">
                <Badge tone="neutral">{p.formato}</Badge>
              </td>
              <td className="py-2.5 text-right font-mono text-[13px] font-bold tabular-nums text-text-1">
                {p.visualizacoes.toLocaleString("pt-BR")}
              </td>
              <td className="py-2.5 text-right font-mono text-[13px] text-text-2 tabular-nums">
                {p.curtidas.toLocaleString("pt-BR")}
              </td>
              <td className="py-2.5 text-right font-mono text-[13px] text-text-2 tabular-nums">
                {p.comentarios.toLocaleString("pt-BR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
