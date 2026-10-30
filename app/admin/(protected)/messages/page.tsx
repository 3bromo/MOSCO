import { Mail } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMessages() {
  const repo = db();
  const [messages, signups] = await Promise.all([repo.listMessages(), repo.listNewsletter()]);

  return (
    <>
      <AdminHeader
        title="Messages"
        subtitle={`${messages.length} contact message${messages.length === 1 ? "" : "s"} · ${signups.length} newsletter subscriber${signups.length === 1 ? "" : "s"}`}
      />

      <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <h2 className="mb-3 font-display text-[15px] uppercase tracking-tight">
            Contact form
          </h2>
          {messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-silver-300 p-10 text-center">
              <Mail className="mx-auto h-7 w-7 text-ice-400" strokeWidth={1.25} />
              <p className="mt-3 text-[13.5px] text-ice-600">No messages yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li key={m.id} className="rounded-lg border border-silver-200 bg-white p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="text-[14px] font-medium">{m.subject}</p>
                    <time className="text-[11.5px] text-ice-500" dateTime={m.created_at}>
                      {new Date(m.created_at).toLocaleString("en-GB")}
                    </time>
                  </div>
                  <p className="mt-1 text-[12.5px] text-ice-600">
                    {m.name} ·{" "}
                    <a href={`mailto:${m.email}`} dir="ltr" className="hover:underline">
                      {m.email}
                    </a>
                  </p>
                  <p className="mt-3 whitespace-pre-line text-[13.5px] leading-relaxed text-ice-700">
                    {m.message}
                  </p>
                  <a
                    href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                    className="btn btn-ghost mt-4 !py-2 !text-[12.5px]"
                  >
                    Reply by email
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-display text-[15px] uppercase tracking-tight">Newsletter</h2>
          {signups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-silver-300 p-10 text-center">
              <p className="text-[13.5px] text-ice-600">No subscribers yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-silver-200 overflow-hidden rounded-lg border border-silver-200 bg-white">
              {signups.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-3 p-3.5">
                  <span dir="ltr" className="truncate text-[13px]">
                    {s.email}
                  </span>
                  <time className="shrink-0 text-[11px] text-ice-500" dateTime={s.created_at}>
                    {new Date(s.created_at).toLocaleDateString("en-GB")}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
