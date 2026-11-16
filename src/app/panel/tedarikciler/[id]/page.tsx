import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { guardFeature } from "@/lib/plan-guard";
import { getSupplier, getSupplierStatement, listFinanceAccounts, localKey } from "@/lib/panel";
import { SupplierForm, type SupplierDraft } from "@/components/supplier-form";
import { SupplierStatementBoard } from "@/components/supplier-statement";

export const instant = false;

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  guardFeature(user.package_name, "tedarikci");
  const { id } = await params;
  const [supplier, statement, accounts] = await Promise.all([
    getSupplier(user.id, id),
    getSupplierStatement(user.id, id),
    listFinanceAccounts(user.id),
  ]);
  if (!supplier) notFound();

  const draft: SupplierDraft = {
    id: supplier.id,
    name: supplier.name,
    taxOffice: supplier.tax_office,
    taxNumber: supplier.tax_number,
    taxExempt: supplier.tax_exempt,
    bankInfo: supplier.bank_info,
    currency: supplier.currency || "TL",
    due: supplier.due_days == null ? "" : String(supplier.due_days),
    opening: moneyInput(supplier.opening_balance_kurus),
    contactPerson: supplier.contact_person,
    emails: supplier.emails,
    address: supplier.address,
    phone: supplier.phone,
    otherContact: supplier.other_contact,
    class1: supplier.class1,
    class2: supplier.class2,
    code: supplier.code,
    note: supplier.note,
  };

  return (
    <div className="space-y-4">
      {statement ? (
        <SupplierStatementBoard
          statement={statement}
          accounts={accounts.map((item) => ({ id: item.id, name: item.name, currency: item.currency, kind: item.kind }))}
          today={localKey(new Date())}
        />
      ) : null}
      <SupplierForm supplier={draft} />
    </div>
  );
}

function moneyInput(kurus: number) {
  return (kurus / 100).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}
