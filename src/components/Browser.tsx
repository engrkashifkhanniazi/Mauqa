"use client";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ALL_SOURCES, type JobView } from "@/lib/types";
import AdSlot from "@/components/AdSlot";
import Follow from "@/components/Follow";
import InstallApp from "@/components/InstallApp";
import FootLinks from "@/components/FootLinks";
import ShareBar from "@/components/ShareBar";
import { AD_SLOTS, SITE } from "@/lib/site";
import { KP, FED, KIND_LABEL, sourceKind, eduLevel, type Edu } from "@/lib/normalize";
import { payRange } from "@/lib/pay";

const msDay = 864e5;
const PAGE = 15;
const fd = (d: string, ur = false) => d ? new Date(d + "T00:00:00").toLocaleDateString(ur ? "ur-PK" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
const I = ({ d, s = 18 }: { d: string; s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const P = { brief: "M3 7h18v13H3zM9 7V5h6v2", bm: "M6 4h12v17l-6-4-6 4z", x: "M6 6l12 12M18 6L6 18", list: "M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1", sliders: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4", bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" };
const PAPERS = ALL_SOURCES.filter((s) => sourceKind(s) === "paper");
const AGENCIES = ALL_SOURCES.filter((s) => sourceKind(s) !== "paper");

/** Interface text in both designs. Job data (titles, departments) stays as published. */
const T = {
  en: { nav: ["All jobs", "Newspapers", "Testing & commissions", "Job alerts"], h1: "Government jobs in KP and Islamabad, checked daily", lede: "Commission, testing-service and newspaper ads in one place, each linked to its official source.", ph: "Search post, department, city, BPS…", find: "Find jobs", clearQ: "Clear search",
    region: "Region", all: "All", kp: "Khyber Pakhtunkhwa", fed: "Islamabad / Federal", city: "City / district", anyCity: "All cities", edu: "Qualification", pay: "Pay scale", any: "Any", noBps: "Contract / lump-sum", closing: "Closing", urgent: "Urgent (3 days)", within10: "Within 10 days", within21: "Within 3 weeks", source: "Source", show: "Show", savedOnly: "Saved jobs only", newOnly: "New in last 2 days",
    eduL: { "": "Any qualification", matric: "Matric / literate", inter: "Intermediate / DAE", bachelor: "Bachelor (14–16 yrs)", master: "Master / MPhil", medical: "Medical / specialised" } as Record<Edu, string>,
    chips: ["All open", "Closing ≤ 3 days", "KP", "Islamabad / Federal", "BPS 17+"], filters: "Filters", done: (n: number) => `Show ${n} matching jobs`, clear: "Clear all", open: "open jobs", sort: "Sort",
    newest: "Newest first", soonest: "Closing soonest", most: "Most vacancies", highest: "Highest BPS", today: "Added today", yday: "Added yesterday", more: (n: number) => `Show 15 more (${n} remaining)`, isNew: "New",
    last: "Last date", view: "View", none: "No jobs match these filters.", posts: "posts", closesToday: "Closes today", left: (n: number) => n < 0 ? "Closed" : n === 0 ? "Closes today" : n === 1 ? "1 day left" : `${n} days left`,
    alertH: "Never miss a closing date", alertP: "Pick your region and qualification; we email you when a matching advertisement is published.", notify: "Notify me", sample: "Sample", foot: "Always confirm details on the official advertisement.",
    ad: "Detail and advertisement", basic: "Basic pay (BPS-2026)", f: ["Last date", "Time left", "Pay scale", "Vacancies", "Education", "Age", "Location", "Source"], disc: "Mauqa links to the official source and does not accept applications.", toggle: "اردو",
    tabs: ["Jobs", "Filters", "Saved", "Alerts"] },
  ur: { nav: ["تمام نوکریاں", "اخبارات", "ٹیسٹنگ و کمیشن", "جاب الرٹ"], h1: "خیبر پختونخوا اور اسلام آباد کی سرکاری نوکریاں، ایک جگہ", lede: "اخبارات اور سرکاری اداروں کے اشتہار، ہر ایک کے ساتھ اصل اشتہار کا لنک۔", ph: "عہدہ، محکمہ، شہر یا سکیل لکھیں", find: "تلاش کریں", clearQ: "تلاش صاف کریں",
    region: "علاقہ", all: "سب", kp: "خیبر پختونخوا", fed: "اسلام آباد / وفاقی", city: "شہر / ضلع", anyCity: "تمام شہر", edu: "تعلیم", pay: "سکیل", any: "کوئی بھی", noBps: "کنٹریکٹ / یکمشت", closing: "آخری تاریخ", urgent: "فوری (3 دن)", within10: "دس دن کے اندر", within21: "تین ہفتوں کے اندر", source: "ذریعہ", show: "دکھائیں", savedOnly: "صرف محفوظ نوکریاں", newOnly: "پچھلے دو دن کی نئی",
    eduL: { "": "کوئی بھی تعلیم", matric: "میٹرک / خواندہ", inter: "انٹرمیڈیٹ / ڈی اے ای", bachelor: "بیچلر (14 تا 16 سال)", master: "ماسٹر / ایم فل", medical: "میڈیکل / خصوصی" } as Record<Edu, string>,
    chips: ["تمام کھلی", "3 دن میں ختم", "خیبر پختونخوا", "اسلام آباد / وفاقی", "سکیل 17+"], filters: "فلٹر", done: (n: number) => `${n} نوکریاں دکھائیں`, clear: "سب صاف کریں", open: "نوکریاں موجود ہیں", sort: "ترتیب",
    newest: "نئی پہلے", soonest: "جلد ختم ہونے والی پہلے", most: "زیادہ اسامیاں پہلے", highest: "بڑا سکیل پہلے", today: "آج شامل ہوئیں", yday: "کل شامل ہوئیں", more: (n: number) => `مزید 15 دکھائیں (${n} باقی)`, isNew: "نئی",
    last: "آخری تاریخ", view: "تفصیل", none: "ان فلٹرز کے مطابق کوئی نوکری نہیں ملی۔", posts: "اسامیاں", closesToday: "آج آخری دن", left: (n: number) => n < 0 ? "بند ہو چکی" : n === 0 ? "آج آخری دن" : `${n} دن باقی`,
    alertH: "کوئی آخری تاریخ نہ چھوٹے", alertP: "اپنا علاقہ اور تعلیم چنیں؛ مطابقت رکھنے والا اشتہار آنے پر ہم ای میل کریں گے۔", notify: "مجھے بتائیں", sample: "نمونہ", foot: "درخواست سے پہلے اصل اشتہار ضرور دیکھیں۔",
    ad: "تفصیل اور اشتہار", basic: "بنیادی تنخواہ (BPS-2026)", f: ["آخری تاریخ", "باقی وقت", "سکیل", "اسامیاں", "تعلیم", "عمر", "جگہ", "ذریعہ"], disc: "موقع صرف اصل ذریعے کا لنک دیتا ہے، درخواستیں قبول نہیں کرتا۔", toggle: "English",
    tabs: ["نوکریاں", "فلٹر", "محفوظ", "الرٹ"] },
};

export default function Browser({ jobs, sample, lang: pageLang = "en" }: { jobs: JobView[]; sample: boolean; lang?: "en" | "ur" }) {
  const ur = pageLang === "ur";
  const t = ur ? T.ur : T.en;
  const [now] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const isNew = (j: JobView) => !!j.added && (now.getTime() - new Date(j.added + "T00:00:00").getTime()) / msDay <= 2;
  const left = (j: JobView) => Math.round((new Date(j.lastDate + "T00:00:00").getTime() - now.getTime()) / msDay);
  const [q, setQ] = useState(""); const [pv, setPv] = useState(""); const [bp, setBp] = useState(""); const [city, setCity] = useState(""); const [edu, setEdu] = useState<Edu>("");
  const [cl, setCl] = useState(0); const [src, setSrc] = useState<string[]>([]); const [onlySaved, setOnlySaved] = useState(false); const [onlyNew, setOnlyNew] = useState(false);
  const [sort, setSort] = useState("n"); const [fo, setFo] = useState(false); const [shown, setShown] = useState(PAGE); const [saved, setSaved] = useState<number[]>([]);
  const [open, setOpen] = useState<JobView | null>(null); const [msg, setMsg] = useState("");
  const dlg = useRef<HTMLDialogElement>(null); const closeBtn = useRef<HTMLButtonElement>(null); const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem("rdf") || "[]")); } catch {} }, []);
  useEffect(() => { if (open) { lastFocus.current = document.activeElement as HTMLElement; dlg.current?.showModal(); closeBtn.current?.focus(); } }, [open]);
  useEffect(() => { document.body.classList.toggle("sheet-open", fo); }, [fo]);

  const toggleSave = (id: number) => setSaved((s) => { const n = s.includes(id) ? s.filter((x) => x !== id) : [...s, id]; try { localStorage.setItem("rdf", JSON.stringify(n)); } catch {} return n; });
  const reset = () => { setQ(""); setPv(""); setBp(""); setCity(""); setEdu(""); setCl(0); setSrc([]); setOnlySaved(false); setOnlyNew(false); };
  const lang = () => { try { localStorage.setItem("rdl", ur ? "en" : "ur"); } catch {} window.location.assign(ur ? "/" : "/ur"); };
  const toList = () => document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" });

  const pool = useMemo(() => jobs.filter((j) => !j.admission), [jobs]);
  const cities = useMemo(() => [...new Set(pool.map((j) => j.city).filter(Boolean))].sort(), [pool]);
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase().replace(/\s+/g, " ");
    const [a, b] = bp && bp !== "none" ? bp.split("-").map(Number) : [0, 99];
    const by = sort === "v" ? (x: JobView, y: JobView) => (y.vacancies ?? 0) - (x.vacancies ?? 0)
      : sort === "b" ? (x: JobView, y: JobView) => (y.bps ?? 0) - (x.bps ?? 0) || x.lastDate.localeCompare(y.lastDate)
      : sort === "n" ? (x: JobView, y: JobView) => (y.added ?? "").localeCompare(x.added ?? "") || x.lastDate.localeCompare(y.lastDate)
      : (x: JobView, y: JobView) => x.lastDate.localeCompare(y.lastDate);
    return pool.filter((j) => {
      if (ql) { const hay = `${j.title} ${j.department} ${j.city} ${j.source} ${j.education} ${j.bps != null ? `bps-${j.bps} bps ${j.bps} bps${j.bps}` : ""}`.toLowerCase(); if (!ql.split(" ").every((w) => hay.includes(w))) return false; }
      if (pv && j.province !== pv) return false;
      if (city && j.city !== city) return false;
      if (edu && eduLevel(j.education) !== edu) return false;
      if (bp === "none" ? j.bps != null : bp && (j.bps == null || j.bps < a || j.bps > b)) return false;
      if (cl && left(j) > cl) return false;
      if (src.length && !src.includes(j.source)) return false;
      if (onlySaved && !saved.includes(j.id)) return false;
      if (onlyNew && !isNew(j)) return false;
      return true;
    }).sort(by);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, q, pv, city, edu, bp, cl, src, onlySaved, onlyNew, saved, sort, now]);
  useEffect(() => setShown(PAGE), [q, pv, city, edu, bp, cl, src, onlySaved, onlyNew, sort]);
  const page = filtered.slice(0, shown);
  const count = (s: string) => pool.filter((j) => j.source === s).length;

  // Active filters as removable pills.
  const srcLabel = src.length && PAPERS.every((s) => !count(s) || src.includes(s)) && src.every((s) => PAPERS.includes(s as never)) ? t.nav[1] : src.length && src.every((s) => AGENCIES.includes(s as never)) && AGENCIES.every((s) => !count(s) || src.includes(s)) ? t.nav[2] : src.join(", ");
  const pills: [string, () => void][] = [
    ...(q ? [[`“${q}”`, () => setQ("")] as [string, () => void]] : []),
    ...(pv ? [[pv === KP ? t.kp : t.fed, () => setPv("")] as [string, () => void]] : []),
    ...(city ? [[city, () => setCity("")] as [string, () => void]] : []),
    ...(edu ? [[t.eduL[edu], () => setEdu("")] as [string, () => void]] : []),
    ...(bp ? [[bp === "none" ? t.noBps : bp === "17-22" ? "BPS 17+" : `BPS ${bp.replace("-", "–")}`, () => setBp("")] as [string, () => void]] : []),
    ...(cl ? [[cl === 3 ? t.urgent : cl === 10 ? t.within10 : t.within21, () => setCl(0)] as [string, () => void]] : []),
    ...(src.length ? [[srcLabel, () => setSrc([])] as [string, () => void]] : []),
    ...(onlySaved ? [[t.savedOnly, () => setOnlySaved(false)] as [string, () => void]] : []),
    ...(onlyNew ? [[t.newOnly, () => setOnlyNew(false)] as [string, () => void]] : []),
  ];
  const nFilters = pills.filter(([l]) => !l.startsWith("“")).length;

  const urgency = (n: number) => n <= 0 ? "today" : n <= 3 ? "soon" : "";
  const dayLabel = (d?: string) => { if (!d) return ""; const n = Math.round((now.getTime() - new Date(d + "T00:00:00").getTime()) / msDay); return n <= 0 ? t.today : n === 1 ? t.yday : fd(d, ur); };
  const head = (j: JobView, i: number) => sort === "n" && j.added && (i === 0 || page[i - 1].added !== j.added) ? <h2 className="u-day">{dayLabel(j.added)}</h2> : null;
  const more = filtered.length > shown ? <button type="button" className="u-more" onClick={() => setShown((n) => n + PAGE)}>{t.more(filtered.length - shown)}</button> : null;
  const feedAd = (i: number) => (i === 5 || i === 13) ? <AdSlot key={"ad" + i} slot={AD_SLOTS.listFeed} kind="feed" /> : null;
  const kind = (j: JobView) => sample ? t.sample : KIND_LABEL[sourceKind(j.source)][ur ? "ur" : "en"];
  const Save = ({ j }: { j: JobView }) => <button className="u-sv" type="button" aria-pressed={saved.includes(j.id)} aria-label={`Save ${j.title}`} onClick={() => toggleSave(j.id)}><I d={P.bm} s={18} /></button>;
  const go = (k: number) => { if (k === 0) { setSrc([]); } if (k === 1) setSrc(PAPERS.filter((s) => count(s))); if (k === 2) setSrc(AGENCIES.filter((s) => count(s))); if (k === 3) { document.getElementById("alerts")?.scrollIntoView({ behavior: "smooth" }); return; } toList(); };

  const search = (
    <form className="u-search" role="search" onSubmit={(e) => { e.preventDefault(); toList(); }}>
      <label className="sr" htmlFor="q">{t.ph}</label>
      <span className="u-q"><input id="q" type="search" placeholder={t.ph} autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && <button type="button" className="u-qx" aria-label={t.clearQ} onClick={() => setQ("")}><I d={P.x} s={16} /></button>}</span>
      <button type="submit">{t.find}</button>
    </form>);

  const chips = (
    <div className="u-chips" role="group" aria-label="Quick filters">
      <button type="button" aria-pressed={!pills.length} onClick={reset}>{t.chips[0]}</button>
      <button type="button" aria-pressed={cl === 3} onClick={() => setCl(cl === 3 ? 0 : 3)}>{t.chips[1]}</button>
      <button type="button" aria-pressed={pv === KP} onClick={() => setPv(pv === KP ? "" : KP)}>{t.chips[2]}</button>
      <button type="button" aria-pressed={pv === FED} onClick={() => setPv(pv === FED ? "" : FED)}>{t.chips[3]}</button>
      <button type="button" aria-pressed={bp === "17-22"} onClick={() => setBp(bp === "17-22" ? "" : "17-22")}><span dir="ltr">{t.chips[4]}</span></button>
    </div>);

  const filters = (<>
    {fo && <div className="u-scrim" onClick={() => setFo(false)} aria-hidden="true" />}
    <aside className={"u-rail" + (fo ? " open" : "")} id="flt" aria-label="Filters">
      <div className="u-sh-h"><span className="u-grab" aria-hidden="true" /><b>{t.filters}</b><button type="button" className="u-sv" aria-label="Close filters" onClick={() => setFo(false)}><I d={P.x} /></button></div>
      <div className="u-sh-b">
        <fieldset><legend>{t.region}</legend>{[["", t.all], [KP, t.kp], [FED, t.fed]].map(([v, l]) => <label key={v}><input type="radio" name="pv" checked={pv === v} onChange={() => setPv(v)} />{l}</label>)}</fieldset>
        <fieldset><legend><label htmlFor="ci">{t.city}</label></legend><select id="ci" className="u-sel" value={city} onChange={(e) => setCity(e.target.value)}><option value="">{t.anyCity}</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}</select></fieldset>
        <fieldset><legend><label htmlFor="ed">{t.edu}</label></legend><select id="ed" className="u-sel" value={edu} onChange={(e) => setEdu(e.target.value as Edu)}>{(Object.keys(t.eduL) as Edu[]).map((k) => <option key={k} value={k}>{t.eduL[k]}</option>)}</select></fieldset>
        <fieldset><legend>{t.pay}</legend>{[["", t.any], ["1-10", "BPS 1–10"], ["11-16", "BPS 11–16"], ["17-22", "BPS 17+"], ["none", t.noBps]].map(([v, l]) => <label key={v}><input type="radio" name="bp" checked={bp === v} onChange={() => setBp(v)} /><span dir={v && v !== "none" ? "ltr" : undefined}>{l}</span></label>)}</fieldset>
        <fieldset><legend>{t.closing}</legend>{([[0, t.any], [3, t.urgent], [10, t.within10], [21, t.within21]] as const).map(([v, l]) => <label key={v}><input type="radio" name="cl" checked={cl === v} onChange={() => setCl(v)} />{l}</label>)}</fieldset>
        <fieldset><legend>{t.source}</legend>{ALL_SOURCES.filter((s) => count(s) > 0).map((s) => <label key={s}><input type="checkbox" checked={src.includes(s)} onChange={(e) => setSrc((x) => e.target.checked ? [...x, s] : x.filter((y) => y !== s))} /><span dir="ltr">{s}</span><span className="c">{count(s)}</span></label>)}</fieldset>
        <fieldset><legend>{t.show}</legend><label><input type="checkbox" checked={onlySaved} onChange={(e) => setOnlySaved(e.target.checked)} />{t.savedOnly}</label><label><input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />{t.newOnly}</label></fieldset>
        <button className="u-clear" type="button" onClick={reset}>{t.clear}</button>
      </div>
      <div className="u-sh-f"><button type="button" className="u-done" onClick={() => { setFo(false); toList(); }}>{t.done(filtered.length)}</button></div>
    </aside></>);

  const bar = (<>
    <div className="u-bar"><b>{filtered.length} {t.open}</b>
      <button type="button" className="u-ft" aria-expanded={fo} aria-controls="flt" onClick={() => setFo(!fo)}><I d={P.sliders} s={16} />{t.filters}{nFilters > 0 && <i className="u-badge">{nFilters}</i>}</button>
      <label className="sr" htmlFor="so">{t.sort}</label><select id="so" value={sort} onChange={(e) => setSort(e.target.value)}><option value="n">{t.newest}</option><option value="d">{t.soonest}</option><option value="v">{t.most}</option><option value="b">{t.highest}</option></select></div>
    {pills.length > 0 && <div className="u-pills">{pills.map(([l, f]) => <button key={l} type="button" onClick={f}><span dir="auto">{l}</span><I d={P.x} s={14} /></button>)}<button type="button" className="u-pclr" onClick={reset}>{t.clear}</button></div>}
  </>);

  const alerts = (
    <div className="u-alert" id="alerts"><div><h3>{t.alertH}</h3><p>{t.alertP}</p></div>
      <form onSubmit={async (e) => { e.preventDefault(); const el = e.currentTarget.elements; const em = (el.namedItem("em") as HTMLInputElement).value;
        const province = (el.namedItem("ap") as HTMLSelectElement).value || undefined; const ed = (el.namedItem("ae") as HTMLSelectElement).value || undefined; setMsg("…");
        try { const r = await fetch("/api/alerts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: em, query: { q: q || undefined, province, edu: ed, bps: bp || undefined } }) }); const d = await r.json();
          setMsg(r.ok ? (d.emailSent ? "Check your inbox to confirm your alert." : d.note ?? "Saved.") : d.error ?? "Something went wrong."); } catch { setMsg("Network error. Try again."); } }}>
        <label className="sr" htmlFor="ap">{t.region}</label><select id="ap" name="ap" defaultValue={pv}><option value="">{t.region}: {t.all}</option><option value={KP}>{t.kp}</option><option value={FED}>{t.fed}</option></select>
        <label className="sr" htmlFor="ae">{t.edu}</label><select id="ae" name="ae" defaultValue={edu}>{(Object.keys(t.eduL) as Edu[]).map((k) => <option key={k} value={k}>{t.eduL[k]}</option>)}</select>
        <label className="sr" htmlFor="em">Email</label><input id="em" name="em" type="email" dir="ltr" placeholder="you@example.com" required /><button type="submit">{t.notify}</button></form>
      <p role="status" className="u-msg">{msg}</p><Follow /></div>);

  const dateBox = (j: JobView) => { const n = left(j); return <><small>{t.last}</small><b className="tn">{fd(j.lastDate, ur)}</b><em className={"tn " + urgency(n)}>{t.left(n)}</em></>; };

  return (
    <div className={ur ? "u3" : "u2"} dir={ur ? "rtl" : "ltr"} lang={ur ? "ur" : "en"}>
      <a className="skip" href="#jobs">Skip to jobs</a>
      {!ur ? (
        <header className="u2-top"><div className="u-wrap u2-nav">
          <a className="u2-logo" href="/">Mauqa</a>
          <nav aria-label="Main">{t.nav.map((n, i) => <button type="button" key={n} className={"u-nl" + (i === 2 ? " u-nl2" : "")} onClick={() => go(i)}>{n}</button>)}<InstallApp className="inst-n" /><button type="button" className="u-lang" lang="ur" onClick={lang}>{t.toggle}</button></nav>
        </div>
          <div className="u-wrap u2-hero" id="top"><h1>{t.h1}</h1><p>{t.lede}</p>{search}{chips}</div></header>
      ) : (<>
        <header className="u-wrap u3-nav"><a className="u3-logo" href="/ur">موقع</a>
          <nav aria-label="Main">{t.nav.map((n, i) => <button type="button" key={n} className={"u-nl" + (i === 2 ? " u-nl2" : "")} onClick={() => go(i)}>{n}</button>)}<InstallApp className="inst-n" /><button type="button" className="u-lang" lang="en" onClick={lang}>{t.toggle}</button></nav></header>
        <section className="u-wrap" id="top"><div className="u3-hero"><h1>{t.h1}</h1><p>{t.lede}</p>{search}{chips}</div></section>
      </>)}
      <main className={"u-wrap " + (ur ? "u3-main" : "u2-main")} id="jobs">
        <div className={ur ? "u3-body" : "u2-body"}>{filters}
          <section className={ur ? "u3-list" : "u2-list"} aria-live="polite">{bar}
            <div className={ur ? "u3-grid" : "u2-feed"}>{page.length ? page.map((j, i) => (<Fragment key={j.id}>{head(j, i)}
              {!ur ? (
                <article className="u2-row">
                  <div className="u2-tx"><span className="u2-src">{isNew(j) && <b className="nw">{t.isNew}</b>}{kind(j)} · {j.source}</span>
                    <h3><button type="button" onClick={() => setOpen(j)}>{j.title}</button></h3><p>{[j.department, j.city].filter(Boolean).join(" · ")}</p>
                    <div className="u2-tags">{j.bps != null && <span>BPS-{j.bps}</span>}{j.vacancies != null && <span>{j.vacancies} {t.posts}</span>}{j.education && <span>{j.education}</span>}</div></div>
                  <div className="u2-side"><div className="u2-date">{dateBox(j)}</div>
                    <div className="u2-act"><Save j={j} /><button className="u2-view" type="button" onClick={() => setOpen(j)}>{t.view}</button></div></div>
                </article>
              ) : (
                <article className="u3-card">
                  <div className="u3-cap"><span>{isNew(j) && <b className="nw">{t.isNew}</b>}{kind(j)} · <bdi dir="ltr">{j.source}</bdi></span><Save j={j} /></div>
                  <h3 dir="auto"><button type="button" onClick={() => setOpen(j)}>{j.title}</button></h3>
                  <p dir="auto">{j.department}</p>
                  <div className="u3-tags">{j.city && <span dir="auto">{j.city}</span>}{j.bps != null && <span dir="ltr">BPS-{j.bps}</span>}{j.education && <span dir="auto">{j.education}</span>}</div>
                  <div className="u3-foot"><span className="u3-d">{dateBox(j)}</span><button type="button" onClick={() => setOpen(j)}>{t.view}</button></div>
                </article>)}
              {feedAd(i)}</Fragment>)) : <div className="u-empty">{t.none}</div>}</div>{more}
            {alerts}
          </section></div></main>
      <footer className="u-foot"><div className="u-wrap"><FootLinks />{sample ? "Sample listings for design review. " : ""}{t.foot}</div></footer>

      <nav className="u-tabs" aria-label="Quick">
        <button type="button" onClick={() => { setOnlySaved(false); toList(); }}><I d={P.list} /><span>{t.tabs[0]}</span></button>
        <button type="button" onClick={() => setFo(true)}><I d={P.sliders} /><span>{t.tabs[1]}</span>{nFilters > 0 && <i className="u-badge">{nFilters}</i>}</button>
        <button type="button" aria-pressed={onlySaved} onClick={() => { setOnlySaved(!onlySaved); toList(); }}><I d={P.bm} /><span>{t.tabs[2]}</span>{saved.length > 0 && <i className="u-badge">{saved.length}</i>}</button>
        <button type="button" onClick={() => go(3)}><I d={P.bell} /><span>{t.tabs[3]}</span></button>
      </nav>

      <dialog ref={dlg} aria-labelledby="dT" onClose={() => { setOpen(null); lastFocus.current?.focus(); }} onClick={(e) => { if (!(e.target as HTMLElement).closest(".sheet")) dlg.current?.close(); }}>
        {open && <div className="sheet">
          <header><h2 id="dT" dir="auto">{open.title}</h2><button ref={closeBtn} className="u-sv" type="button" aria-label="Close" onClick={() => dlg.current?.close()}><I d={P.x} /></button></header>
          <div className="bd"><p className="nt" dir="auto">{open.department}{open.department ? " · " : ""}{kind(open)} · {open.source}</p>
            <div className="fc">{([[t.f[0], fd(open.lastDate, ur)], [t.f[1], t.left(left(open))], [t.f[2], open.bps != null ? `BPS-${open.bps}` : ""], [t.basic, payRange(open.bps)], [t.f[3], open.vacancies != null ? String(open.vacancies) : ""], [t.f[4], open.education], [t.f[5], open.age], [t.f[6], [open.city, open.province].filter(Boolean).join(", ")]] as const).filter(([, v]) => v).map(([k, v]) => <div key={k}><small>{k}</small><b dir="auto">{v}</b></div>)}</div>
            <a className="cta" href={`/jobs/${open.slug}`} style={{ textAlign: "center", textDecoration: "none", display: "grid", placeItems: "center" }}>{t.ad}</a>
            <ShareBar url={`${SITE}/jobs/${open.slug}`} title={open.title} dept={open.department} last={fd(open.lastDate)} posts={open.vacancies} bps={open.bps} />
            <p className="nt">{t.disc}</p></div>
        </div>}
      </dialog>
    </div>
  );
}
