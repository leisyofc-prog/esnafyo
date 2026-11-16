import { getCurrentUser } from "@/lib/auth";
import { buildBankTemplate } from "@/lib/bank-sheet";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const file = await buildBankTemplate();
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=\"esnafyo-banka-dokumu.xlsx\"",
    },
  });
}
