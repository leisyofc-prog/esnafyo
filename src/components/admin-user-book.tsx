"use client";

import { useMemo, useState } from "react";
import type { AdminUser } from "@/lib/admin";

export function AdminUserBook({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("tr");
    return users.filter((item) => text === "" || `${item.business} ${item.name} ${item.email} ${item.phone}`.toLocaleLowerCase("tr").includes(text));
  }, [query, users]);

  return (
    <section className="rounded-xl border border-[#eceff3] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f2f4f7] px-4 py-3">
        <h2 className="text-[15px] font-semibold">
          Esnaflar <span className="ml-1 rounded-md bg-[#fff1e6] px-1.5 py-0.5 text-[11px] text-[#c2410c]">{users.length}</span>
        </h2>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Dükkân, ad veya e-posta ara" className="h-9 w-full rounded-lg border border-[#e4e7ec] px-3 text-[13px] md:w-64" />
      </div>
      {visible.length === 0 ? <p className="px-4 py-12 text-center text-[13px] text-[#98a2b3]">Kayıt yok.</p> : (
        <ul>
          {visible.map((item) => (
            <li key={item.id} className="grid gap-1 border-b border-[#f2f4f7] px-4 py-3 text-[13px] last:border-0 md:grid-cols-[1.3fr_1fr_0.8fr_auto] md:items-center">
              <span>
                <span className="block font-semibold">{item.business}</span>
                <span className="text-[#98a2b3]">{item.name} · {item.phone}</span>
              </span>
              <span className="text-[#475467]">{item.email}</span>
              <span className="text-[#98a2b3]">{item.packageName}</span>
              <span className={item.role === "admin" ? "font-semibold text-[#c2410c]" : "text-[#98a2b3]"}>{item.role === "admin" ? "Yönetici" : showDate(item.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function showDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}
