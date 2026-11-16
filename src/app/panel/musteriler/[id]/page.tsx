import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  formatTime,
  getCustomer,
  getCustomerStatement,
  listBranches,
  listCustomerAppointments,
  listFinanceAccounts,
  listStaff,
  localKey,
} from "@/lib/panel";
import { CustomerForm, type CustomerDraft } from "@/components/customer-form";
import { CustomerStatementBoard } from "@/components/customer-statement";

export const instant = false;

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  const { id } = await params;
  const [customer, branches, staff, appointments, statement, accounts] = await Promise.all([
    getCustomer(user.id, id),
    listBranches(user.id, id),
    listStaff(user.id),
    listCustomerAppointments(user.id, id),
    getCustomerStatement(user.id, id),
    listFinanceAccounts(user.id),
  ]);
  if (!customer) notFound();

  const draft: CustomerDraft = {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    emails: customer.emails,
    otherContact: customer.other_contact,
    contactPerson: customer.contact_person,
    address: customer.address,
    shippingAddress: customer.shipping_address,
    taxOffice: customer.tax_office,
    taxNumber: customer.tax_number,
    taxExempt: customer.tax_exempt,
    bankInfo: customer.bank_info,
    currency: customer.currency || "TL",
    risk: moneyInput(customer.risk_limit_kurus),
    due: customer.due_days == null ? "" : String(customer.due_days),
    discount: customer.discount_percent == null ? "" : String(customer.discount_percent),
    priceList: customer.price_list,
    opening: moneyInput(customer.opening_balance_kurus),
    class1: customer.class1,
    class2: customer.class2,
    code: customer.code,
    note: customer.note,
    staffIds: customer.staff_ids.split(",").filter(Boolean),
    image: Boolean(customer.image_path),
  };

  return (
    <div className="space-y-4">
      {statement ? (
        <CustomerStatementBoard
          statement={statement}
          accounts={accounts.map((item) => ({ id: item.id, name: item.name, currency: item.currency, kind: item.kind }))}
          today={localKey(new Date())}
        />
      ) : null}
      <CustomerForm customer={draft} branches={branches} staff={staff.map((item) => ({ id: item.id, name: item.name }))} />
      <section className="rounded-xl border border-[#eceff3] bg-white p-5">
        <h2 className="text-[15px] font-semibold">Randevuları</h2>
        {appointments.length === 0 ? <p className="mt-3 text-[13px] text-[#98a2b3]">Bu müşterinin randevusu yok.</p> : (
          <ul className="mt-3 divide-y divide-[#f2f4f7]">
            {appointments.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2 text-[13px]">
                <span>{new Date(item.starts_at).toLocaleDateString("tr-TR")} {formatTime(item.starts_at)} · {item.service} · {item.staff_name}</span>
                <span className="text-[#98a2b3]">{item.status === "onayli" ? "Onaylı" : item.status === "iptal" ? "İptal" : "Bekliyor"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function moneyInput(kurus: number | null) {
  if (kurus == null) return "";
  return (kurus / 100).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}
