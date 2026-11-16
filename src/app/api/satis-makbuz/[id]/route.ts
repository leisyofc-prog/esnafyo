import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { guardFeature } from "@/lib/plan-guard";
import { getSale, getCustomer, getSettings } from "@/lib/panel";
import { renderSalePdf } from "@/lib/sale-pdf";

export const instant = false;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  guardFeature(user.package_name, "gelir");

  const { id } = await params;
  const [sale, settings] = await Promise.all([
    getSale(user.id, id),
    getSettings(user.id),
  ]);

  if (!sale) {
    return new Response("Makbuz bulunamadı.", { status: 404 });
  }

  const customer = sale.customerId ? await getCustomer(user.id, sale.customerId) : null;

  const pdf = await renderSalePdf(
    sale,
    {
      businessName: user.business_name,
      phone: user.phone,
      address: settings?.address ?? "",
      taxOffice: settings?.tax_office ?? "",
      taxNumber: settings?.tax_number ?? "",
      bankInfo: settings?.bank_info ?? "",
    },
    customer,
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="makbuz-${sale.id.slice(0, 8)}.pdf"`,
    },
  });
}
