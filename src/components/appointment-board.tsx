"use client";

import { useState } from "react";
import Link from "next/link";
import { addAppointment, addStaff, postponeAppointment, saveHours, setAppointmentStatus, toggleStaff } from "@/app/panel/actions";

type Appointment = {
  id: string;
  customerId: string;
  time: string;
  name: string;
  phone: string;
  service: string;
  staff: string;
  status: string;
};

type Day = { key: string; label: string; items: Appointment[] };
type Person = { id: string; name: string; available: boolean };
type Customer = { id: string; name: string; phone: string };

const statusText: Record<string, string> = {
  bekliyor: "Bekliyor",
  onayli: "Onaylı",
  iptal: "İptal",
};

const statusClass: Record<string, string> = {
  bekliyor: "bg-[#fff7ed] text-[#c2410c]",
  onayli: "bg-[#ecfdf3] text-[#15803d]",
  iptal: "bg-[#fef2f2] text-[#dc2626]",
};

export function AppointmentBoard({
  days,
  week,
  staff,
  customers,
  when,
  openTime,
  closeTime,
  closedDays,
  whatsapp,
  sms,
}: {
  days: Day[];
  week: boolean;
  staff: Person[];
  customers: Customer[];
  when: string;
  openTime: string;
  closeTime: string;
  closedDays: string;
  whatsapp: boolean;
  sms: boolean;
}) {
  const [adding, setAdding] = useState(days.every((day) => day.items.length === 0));
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerId, setCustomerId] = useState("");
  const total = days.reduce((sum, day) => sum + day.items.length, 0);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-[#eceff3] bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold">{week ? "Bu hafta" : "Bugün"}</h2>
              <span className="rounded-full bg-[#fff4ec] px-2 py-0.5 text-[11px] font-semibold text-[#c2410c]">{total} randevu</span>
            </div>
            <p className="mt-1 text-[13px] text-[#98a2b3]">Müşteri, hizmet ve çalışan. Onay, erteleme ve iptal buradan.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/panel/randevular" className={`h-8 rounded-full px-3 text-[12px] font-semibold leading-8 ${week ? "bg-[#f4f6f8] text-[#475467]" : "bg-[#fff4ec] text-[#c2410c]"}`}>Gün</Link>
            <Link href="/panel/randevular?gorunum=hafta" className={`h-8 rounded-full px-3 text-[12px] font-semibold leading-8 ${week ? "bg-[#fff4ec] text-[#c2410c]" : "bg-[#f4f6f8] text-[#475467]"}`}>Hafta</Link>
            <button type="button" onClick={() => setAdding((value) => !value)} className="inline-flex h-9 items-center rounded-lg bg-[#f97316] px-3 text-[13px] font-semibold text-white">+ Yeni randevu</button>
          </div>
        </div>

        {adding ? (
          <form action={addAppointment} className="grid gap-2 border-t border-[#f2f4f7] px-5 py-4 md:grid-cols-2">
            {customers.length > 0 ? (
              <label className="text-[13px] font-semibold md:col-span-2">Kayıtlı müşteri
                  <select
                  className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-2 font-normal"
                  value={customerId}
                  onChange={(event) => {
                    const customer = customers.find((item) => item.id === event.target.value);
                    setCustomerId(event.target.value);
                    if (!customer) return;
                    setName(customer.name);
                    setPhone(customer.phone);
                  }}
                >
                  <option value="">Listeden seç veya aşağıya yaz</option>
                  {customers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.phone}</option>)}
                </select>
              </label>
            ) : null}
            <input type="hidden" name="customer" value={customerId} />
            <input name="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Müşteri adı" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
            <input name="phone" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefon" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
            <input name="service" required placeholder="Hizmet" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
            {staff.length === 0 ? (
              <p className="text-[13px] text-[#98a2b3]">Randevu için önce aşağıdaki alandan çalışan ekle.</p>
            ) : (
              <select name="staff" className="h-9 rounded-lg border border-[#e4e7ec] px-2 text-[13px]" defaultValue={staff.find((item) => item.available)?.name ?? staff[0].name}>
                {staff.map((person) => <option key={person.id} value={person.name}>{person.name}{person.available ? "" : " · izinli"}</option>)}
              </select>
            )}
            <input name="when" required type="datetime-local" defaultValue={when} className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px] md:col-span-2" />
            <button disabled={staff.length === 0} className="h-9 w-fit rounded-lg bg-[#1e293b] px-4 text-[13px] font-semibold text-white disabled:opacity-40">Ekle</button>
          </form>
        ) : null}

        <div className={`grid gap-3 border-t border-[#f2f4f7] p-4 ${week ? "lg:grid-cols-2" : ""}`}>
          {days.map((day) => (
            <div key={day.key} className="rounded-lg border border-[#f2f4f7]">
              <h3 className="border-b border-[#f2f4f7] px-4 py-2 text-[13px] font-semibold">{day.label}</h3>
              {day.items.length === 0 ? <p className="px-4 py-6 text-[13px] text-[#98a2b3]">Bu aralıkta randevu yok.</p> : (
                <ul>
                  {day.items.map((item) => (
                    <li key={item.id} className="border-t border-[#f2f4f7] px-4 py-3 text-[13px] first:border-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{item.time} · {item.customerId ? <Link href={`/panel/musteriler/${item.customerId}`} className="underline">{item.name}</Link> : item.name}</p>
                          <p className="mt-1 text-[#475467]">{item.service} · {item.staff} · {item.phone}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass[item.status] ?? "bg-[#f4f6f8]"}`}>{statusText[item.status] ?? item.status}</span>
                      </div>
                      {item.status !== "iptal" ? (
                        <div className="mt-2 flex gap-3">
                          {item.status !== "onayli" ? (
                            <form action={setAppointmentStatus}>
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="status" value="onayli" />
                              <button className="font-semibold text-[#15803d]">Onayla</button>
                            </form>
                          ) : null}
                          <form action={postponeAppointment}>
                            <input type="hidden" name="id" value={item.id} />
                            <button className="font-semibold text-[#1c2430]">Yarın</button>
                          </form>
                          <form action={setAppointmentStatus}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="status" value="iptal" />
                            <button className="font-semibold text-[#dc2626]">İptal</button>
                          </form>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <form action={saveHours} className="rounded-xl border border-[#eceff3] bg-white p-5">
          <h2 className="text-[15px] font-semibold">Çalışma saatleri</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input name="open" type="time" defaultValue={openTime} className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
            <input name="close" type="time" defaultValue={closeTime} className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
          </div>
          <input name="closed" defaultValue={closedDays} placeholder="Tatil günleri" className="mt-2 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
          <label className="mt-3 flex items-center gap-2 text-[13px]"><input type="checkbox" name="whatsapp" defaultChecked={whatsapp} /> WhatsApp hatırlatma</label>
          <label className="mt-2 flex items-center gap-2 text-[13px]"><input type="checkbox" name="sms" defaultChecked={sms} /> SMS hatırlatma</label>
          <button className="mt-3 h-9 rounded-lg bg-[#1e293b] px-4 text-[13px] font-semibold text-white">Kaydet</button>
        </form>

        <div className="rounded-xl border border-[#eceff3] bg-white p-5">
          <h2 className="text-[15px] font-semibold">Çalışanlar</h2>
          <form action={addStaff} className="mt-3 flex gap-2">
            <input name="name" required placeholder="Çalışan adı" className="h-9 min-w-0 flex-1 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
            <button className="h-9 rounded-lg bg-[#f97316] px-3 text-[13px] font-semibold text-white">Ekle</button>
          </form>
          {staff.length === 0 ? <p className="mt-3 text-[13px] text-[#98a2b3]">Henüz çalışan yok.</p> : (
            <ul className="mt-3 divide-y divide-[#f2f4f7]">
              {staff.map((person) => (
                <li key={person.id} className="flex items-center justify-between py-2 text-[13px]">
                  <span className="font-medium">{person.name}</span>
                  <form action={toggleStaff}>
                    <input type="hidden" name="id" value={person.id} />
                    <button className={`font-semibold ${person.available ? "text-[#15803d]" : "text-[#c2410c]"}`}>{person.available ? "Müsait" : "İzinli"}</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
