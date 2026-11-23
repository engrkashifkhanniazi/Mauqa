"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_SOURCES, type JobView } from "@/lib/types";

const msDay = 864e5;
const fd = (d: string, ur = false) => d ? new Date(d + "T00:00:00").toLocaleDateString(ur ? "ur-PK" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
const I = ({ d, s = 18 }: { d: string; s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const P = { brief: "M3 7h18v13H3zM9 7V5h6v2", bm: "M6 4h12v17l-6-4-6 4z", x: "M6 6l12 12M18 6L6 18", search: "M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-4-4", clock: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 7v5l3 2" };

/** Text in both designs. Job data itself (titles, departments) stays as published. */
const T = {
  en: { nav: ["All jobs", "Newspapers", "Job alerts"], h1: "Government jobs in KP and Islamabad, checked daily", lede: "Commission, testing-service and newspaper ads in one place, each linked to its official source.", ph: "Search by post, department or city", find: "Find jobs", region: "Region", all: "All", kp: "Khyber Pakhtunkhwa", fed: "Islamabad / Federal", pay: "Pay scale", any: "Any", closing: "Closing", within10: "Within 10 days", within21: "Within 3 weeks", source: "Source", show: "Show", savedOnly: "Saved jobs only", clear: "Clear filters", open: "open jobs", soonest: "Closing soonest", most: "Most vacancies", last: "Last date", view: "View", none: "No jobs match these filters.", chips: ["Today's jobs", "Closing soon"], alertH: "Never miss a closing date", alertP: "Get an email when a new advertisement matches your search.", notify: "Notify me", unv: "Unverified", ver: "Verified", sample: "Sample", foot: "Always confirm details on the official advertisement.", how: "How to apply", steps: (s: string) => ["Read the eligibility in the official advertisement.", `Apply on the ${s} portal or as the ad says, before the last date.`, "Keep documents and fee receipt ready."], ad: "Full details and ad picture", left: (n: number) => n < 0 ? "Closed" : `${n} days left`, f: ["Last date", "Time left", "Pay scale", "Vacancies", "Education", "Age", "Location", "Source"], disc: "Rozgar Desk links to the official source and does not accept applications.", toggle: "اردو" },
  ur: { nav: ["تمام نوکریاں", "اخبارات", "جاب الرٹ"], h1: "خیبر پختونخوا اور اسلام آباد کی سرکاری نوکریاں، ایک جگہ", lede: "اخبارات اور سرکاری اداروں کے اشتہار، ہر ایک کے ساتھ اصل اشتہار کا لنک۔", ph: "عہدہ، محکمہ یا شہر لکھیں", find: "تلاش کریں", region: "علاقہ", all: "سب", kp: "خیبر پختونخوا", fed: "اسلام آباد / وفاقی", pay: "سکیل", any: "کوئی بھی", closing: "آخری تاریخ", within10: "دس دن کے اندر", within21: "تین ہفتوں کے اندر", source: "ذریعہ", show: "دکھائیں", savedOnly: "صرف محفوظ نوکریاں", clear: "فلٹر صاف کریں", open: "نوکریاں موجود ہیں", soonest: "جلد ختم ہونے والی پہلے", most: "زیادہ اسامیاں پہلے", last: "آخری تاریخ", view: "تفصیل", none: "ان فلٹرز کے مطابق کوئی نوکری نہیں ملی۔", chips: ["آج کی نوکریاں", "جلد ختم ہونے والی"], alertH: "کوئی آخری تاریخ نہ چھوٹے", alertP: "نیا اشتہار آنے پر ای میل حاصل کریں۔", notify: "مجھے بتائیں", unv: "غیر تصدیق شدہ", ver: "تصدیق شدہ", sample: "نمونہ", foot: "درخواست سے پہلے اصل اشتہار ضرور دیکھیں۔", how: "درخواست کیسے دیں", steps: (s: string) => ["اصل اشتہار میں اہلیت پڑھیں۔", `آخری تاریخ سے پہلے ${s} کے طریقے کے مطابق درخواست دیں۔`, "کاغذات اور فیس کی رسید تیار رکھیں۔"], ad: "مکمل تفصیل اور اشتہار کی تصویر", left: (n: number) => n < 0 ? "بند ہو چکی" : `${n} دن باقی`, f: ["آخری تاریخ", "باقی وقت", "سکیل", "اسامیاں", "تعلیم", "عمر", "جگہ", "ذریعہ"], disc: "روزگار ڈیسک صرف اصل ذریعے کا لنک دیتا ہے، درخواستیں قبول نہیں کرتا۔", toggle: "English" },
};

export default function Browser({ jobs, sample }: { jobs: JobView[]; sample: boolean }) {
  const [now] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const left = (j: JobView) => Math.round((new Date(j.lastDate + "T00:00:00").getTime() - now.getTime()) / msDay);
  const [q, setQ] = useState(""); const [pv, setPv] = useState(""); const [bp, setBp] = useState("");
  const [cl, setCl] = useState(0); const [src, setSrc] = useState<string[]>([]); const [onlySaved, setOnlySaved] = useState(false);
  const [sort, setSort] = useState("d"); const [saved, setSaved] = useState<number[]>([]);
  const [open, setOpen] = useState<JobView | null>(null); const [ur, setUr] = useState(false); const [msg, setMsg] = useState("");
  const dlg = useRef<HTMLDialogElement>(null); const closeBtn = useRef<HTMLButtonElement>(null); const lastFocus = useRef<HTMLElement | null>(null);
  const t = ur ? T.ur : T.en;

  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem("rdf") || "[]")); } catch {} setUr(document.documentElement.lang === "ur"); }, []);
  useEffect(() => { if (open) { lastFocus.current = document.activeElement as HTMLElement; dlg.current?.showModal(); closeBtn.current?.focus(); } }, [open]);

  const toggleSave = (id: number) => setSaved((s) => { const n = s.includes(id) ? s.filter((x) => x !== id) : [...s, id]; try { localStorage.setItem("rdf", JSON.stringify(n)); } catch {} return n; });
  const reset = () => { setQ(""); setPv(""); setBp(""); setCl(0); setSrc([]); setOnlySaved(false); };
  const lang = () => { const r = document.documentElement; const u = !ur; r.lang = u ? "ur" : "en"; r.dir = u ? "rtl" : "ltr"; setUr(u); try { localStorage.setItem("rdl", u ? "ur" : "en"); } catch {} window.scrollTo({ top: 0 }); };

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const [a, b] = bp ? bp.split("-").map(Number) : [0, 99];
    const by = sort === "v" ? (x: JobView, y: JobView) => (y.vacancies ?? 0) - (x.vacancies ?? 0) : (x: JobView, y: JobView) => x.lastDate.localeCompare(y.lastDate);
    return jobs.filter((j) => {
      if (ql && !(j.title + " " + j.department + " " + j.city).toLowerCase().includes(ql)) return false;
      if (pv === "kp" && !/khyber|kp|peshawar/i.test(j.province + " " + j.city)) return false;
      if (pv === "fed" && !/federal|islamabad/i.test(j.province + " " + j.city)) return false;
      if (bp && (j.bps == null || j.bps < a || j.bps > b)) return false;
      if (cl && left(j) > cl) return false;
      if (src.length && !src.includes(j.source)) return false;
      if (onlySaved && !saved.includes(j.id)) return false;
      return true;
    }).sort(by);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, q, pv, bp, cl, src, onlySaved, saved, sort, now]);
  const count = (s: string) => jobs.filter((j) => j.source === s).length;
  const toList = () => document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" });
  const badge = (j: JobView) => j.verified ? t.ver : sample ? t.sample : t.unv;
  const Save = ({ j }: { j: JobView }) => <button className="u-sv" type="button" aria-pressed={saved.includes(j.id)} aria-label={`Save ${j.title}`} onClick={() => toggleSave(j.id)}><I d={P.bm} s={16} /></button>;

  const search = (
    <form className="u-search" role="search" onSubmit={(e) => { e.preventDefault(); toList(); }}>
      <label className="sr" htmlFor="q">{t.ph}</label>
      <input id="q" type="search" placeholder={t.ph} autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
      <button type="submit">{t.find}</button>
    </form>);

  const filters = (
    <aside className="u-rail" aria-label="Filters">
      <fieldset><legend>{t.region}</legend>{[["", t.all], ["kp", t.kp], ["fed", t.fed]].map(([v, l]) => <label key={v}><input type="radio" name="pv" checked={pv === v} onChange={() => setPv(v)} />{l}</label>)}</fieldset>
      <fieldset><legend>{t.pay}</legend>{[["", t.any], ["1-10", "BPS 1–10"], ["11-16", "BPS 11–16"], ["17-22", "BPS 17+"]].map(([v, l]) => <label key={v}><input type="radio" name="bp" checked={bp === v} onChange={() => setBp(v)} /><span dir="ltr">{l}</span></label>)}</fieldset>
      <fieldset><legend>{t.closing}</legend>{([[0, t.any], [10, t.within10], [21, t.within21]] as const).map(([v, l]) => <label key={v}><input type="radio" name="cl" checked={cl === v} onChange={() => setCl(v)} />{l}</label>)}</fieldset>
      <fieldset><legend>{t.source}</legend>{ALL_SOURCES.filter((s) => count(s) > 0).map((s) => <label key={s}><input type="checkbox" checked={src.includes(s)} onChange={(e) => setSrc((x) => e.target.checked ? [...x, s] : x.filter((y) => y !== s))} /><span dir="ltr">{s}</span><span className="c">{count(s)}</span></label>)}</fieldset>
      <fieldset><legend>{t.show}</legend><label><input type="checkbox" checked={onlySaved} onChange={(e) => setOnlySaved(e.target.checked)} />{t.savedOnly}</label></fieldset>
      <button className="u-clear" type="button" onClick={reset}>{t.clear}</button>
    </aside>);

  const bar = (<div className="u-bar"><b>{filtered.length} {t.open}</b><label className="sr" htmlFor="so">Sort</label><select id="so" value={sort} onChange={(e) => setSort(e.target.value)}><option value="d">{t.soonest}</option><option value="v">{t.most}</option></select></div>);

  const alerts = (
    <div className="u-alert" id="alerts"><div><h3>{t.alertH}</h3><p>{t.alertP}</p></div>
      <form onSubmit={async (e) => { e.preventDefault(); const em = (e.currentTarget.elements.namedItem("em") as HTMLInputElement).value; setMsg("…");
        try { const r = await fetch("/api/alerts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: em, query: { q: q || undefined, bps: bp || undefined } }) }); const d = await r.json();
          setMsg(r.ok ? (d.emailSent ? "Check your inbox to confirm your alert." : d.note ?? "Saved.") : d.error ?? "Something went wrong."); } catch { setMsg("Network error. Try again."); } }}>
        <label className="sr" htmlFor="em">Email</label><input id="em" name="em" type="email" dir="ltr" placeholder="you@example.com" required /><button type="submit">{t.notify}</button></form>
      <p role="status" className="u-msg">{msg}</p></div>);

  return (
    <div className={ur ? "u3" : "u2"}>
      <a className="skip" href="#jobs">Skip to jobs</a>
      {!ur ? (<>
        <header className="u2-top"><div className="u-wrap u2-nav">
          <a className="u2-logo" href="#top">Rozgar Desk</a>
          <nav aria-label="Main">{t.nav.map((n, i) => <a key={n} href={["#jobs", "#jobs", "#alerts"][i]}>{n}</a>)}<button type="button" className="u-lang" lang="ur" onClick={lang}>{t.toggle}</button></nav>
        </div>
          <div className="u-wrap u2-hero" id="top"><h1>{t.h1}</h1><p>{t.lede}</p>{search}</div></header>
        <main className="u-wrap u2-main" id="jobs">{filters}
          <section className="u2-list" aria-live="polite">{bar}
            {filtered.length ? filtered.map((j) => (
              <article key={j.id} className="u2-row">
                <div className="u2-ic"><I d={P.brief} s={22} /></div>
                <div className="u2-tx"><h3><button type="button" onClick={() => setOpen(j)}>{j.title}</button></h3><p>{[j.department, j.city].filter(Boolean).join(" · ")}</p><span className="u2-src">{j.source} · {badge(j)}</span></div>
                <div className="u2-tags">{j.bps != null && <span>BPS-{j.bps}</span>}{j.vacancies != null && <span>{j.vacancies} posts</span>}{j.education && <span>{j.education}</span>}</div>
                <div className="u2-date"><small>{t.last}</small><b>{fd(j.lastDate)}</b><em className={left(j) <= 7 ? "hot" : ""}>{t.left(left(j))}</em></div>
                <div className="u2-act"><Save j={j} /><button className="u2-view" type="button" onClick={() => setOpen(j)}>{t.view}</button></div>
              </article>)) : <div className="u-empty">{t.none}</div>}
            {alerts}
          </section></main>
      </>) : (<>
        <header className="u-wrap u3-nav"><a className="u3-logo" href="#top">روزگار ڈیسک</a>
          <nav aria-label="Main">{t.nav.map((n, i) => <a key={n} href={["#jobs", "#jobs", "#alerts"][i]}>{n}</a>)}<button type="button" className="u-lang" lang="en" onClick={lang}>{t.toggle}</button></nav></header>
        <section className="u-wrap" id="top"><div className="u3-hero"><h1>{t.h1}</h1><p>{t.lede}</p>{search}</div></section>
        <main className="u-wrap u3-main" id="jobs">
          <div className="u3-chips"><button type="button" aria-pressed={cl === 0 && !pv} onClick={() => { setCl(0); setPv(""); }}>{t.chips[0]}</button><button type="button" aria-pressed={cl === 10} onClick={() => setCl(10)}>{t.chips[1]}</button><button type="button" aria-pressed={pv === "kp"} onClick={() => setPv(pv === "kp" ? "" : "kp")}>{t.kp}</button><button type="button" aria-pressed={pv === "fed"} onClick={() => setPv(pv === "fed" ? "" : "fed")}>{t.fed}</button></div>
          <div className="u3-body">{filters}
            <section aria-live="polite">{bar}
              <div className="u3-grid">{filtered.length ? filtered.map((j) => (
                <article key={j.id} className="u3-card">
                  <div className="u3-cap"><span dir="ltr">{j.source}</span><Save j={j} /></div>
                  <h3 dir="auto"><button type="button" onClick={() => setOpen(j)}>{j.title}</button></h3>
                  <p dir="auto">{j.department}</p>
                  <div className="u3-tags">{j.city && <span dir="auto">{j.city}</span>}{j.bps != null && <span dir="ltr">BPS-{j.bps}</span>}{j.education && <span dir="auto">{j.education}</span>}</div>
                  <div className="u3-foot"><span>{t.last}: <b>{fd(j.lastDate, true)}</b></span><button type="button" onClick={() => setOpen(j)}>{t.view}</button></div>
                </article>)) : <div className="u-empty">{t.none}</div>}</div>
              {alerts}
            </section></div></main>
      </>)}
      <footer className="u-foot"><div className="u-wrap">{sample ? "Sample listings for design review. " : ""}{t.foot}</div></footer>

      <dialog ref={dlg} aria-labelledby="dT" onClose={() => { setOpen(null); lastFocus.current?.focus(); }} onClick={(e) => { if (!(e.target as HTMLElement).closest(".sheet")) dlg.current?.close(); }}>
        {open && <div className="sheet">
          <header><h2 id="dT" dir="auto">{open.title}</h2><button ref={closeBtn} className="u-sv" type="button" aria-label="Close" onClick={() => dlg.current?.close()}><I d={P.x} /></button></header>
          <div className="bd"><p className="nt" dir="auto">{open.department}. {badge(open)}</p>
            <div className="fc">{([[t.f[0], fd(open.lastDate, ur)], [t.f[1], t.left(left(open))], [t.f[2], open.bps != null ? `BPS-${open.bps}` : ""], [t.f[3], open.vacancies != null ? String(open.vacancies) : ""], [t.f[4], open.education], [t.f[5], open.age], [t.f[6], open.city], [t.f[7], open.source]] as const).filter(([, v]) => v).map(([k, v]) => <div key={k}><small>{k}</small><b dir="auto">{v}</b></div>)}</div>
            <div><h3 style={{ fontSize: 17, marginBottom: 10 }}>{t.how}</h3><ol>{t.steps(open.source).map((s) => <li key={s}>{s}</li>)}</ol></div>
            <a className="cta" href={`/jobs/${open.slug}`} style={{ textAlign: "center", textDecoration: "none", display: "grid", placeItems: "center" }}>{t.ad}</a>
            <p className="nt">{t.disc}</p></div>
        </div>}
      </dialog>
    </div>
  );
}
