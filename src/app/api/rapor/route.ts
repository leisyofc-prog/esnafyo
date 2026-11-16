import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { guardFeature } from "@/lib/plan-guard";
import { renderReportPdf } from "@/lib/report-pdf";
import { buildMonthlyReport, reportMonth } from "@/lib/report";

export async function GET(request: Request) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  guardFeature(user.package_name, "rapor");
  const month = new URL(request.url).searchParams.get("ay") ?? undefined;
  const today = new Date();
  const chosen = reportMonth(month, today);
  const report = await buildMonthlyReport(user.id, chosen.year, chosen.month, user.business_name, user.name);
  const pdf = await renderReportPdf(report);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="esnafyo-rapor-${report.key}.pdf"`,
    },
  });
}
