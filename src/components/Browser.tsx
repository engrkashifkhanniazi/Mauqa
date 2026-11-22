"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_SOURCES, GOV, isGov, type JobView } from "@/lib/types";

const COL: Record<string, string> = { FPSC: "--fpsc", KPPSC: "--kppsc", ETEA: "--etea" };
const cv = (s: string) => { const k = COL[s] ?? "--news"; return { ["--c" as string]: `var(${k})`, ["--cs" as string]: `var(${k}-s)` } as React.CSSProperties; };
const msDay = 864e5;
const fd = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const Bm = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4z" /></svg>;

export default function Browser({ jobs, sample }: { jobs: JobView[]; sample: boolean }) {
  const [now] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const left = (j: JobView) => Math.round((new Date(j.lastDate + "T00:00:00").getTime() - now.getTime()) / msDay);
  const [q, setQ] = useState(""); const [pv, setPv] = useState(""); const [bp, setBp] = useState("");
  const [cl, setCl] = useState(0); const [src, setSrc] = useState<string[]>([]); const [onlySaved, setOnlySaved] = useState(false);
  const [sort, setSort] = useState("d"); const [saved, setSaved] = useState<number[]>([]);
  const [open, setOpen] = useState<JobView | null>(null); const [dark, setDark] = useState(false); const [ur, setUr] = useState(false);
  const [msg, setMsg] = useState("");
  const dlg = useRef<HTMLDialogElement>(null); const closeBtn = useRef<HTMLButtonElement>(null); const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem("rdf") || "[]")); } catch {}
    const r = document.documentElement;
    setDark(r.dataset.theme === "dark" || (!r.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches));
    setUr(r.lang === "ur");
  }, []);
  useEffect(() => { if (open) { lastFocus.current = document.activeElement as HTMLElement; dlg.current?.showModal(); closeBtn.current?.focus(); } }, [open]);

  const toggleSave = (id: number) => setSaved((s) => { const n = s.includes(id) ? s.filter((x) => x !== id) : [...s, id]; try { localStorage.setItem("rdf", JSON.stringify(n)); } catch {} return n; });
  const reset = () => { setQ(""); setPv(""); setBp(""); setCl(0); setSrc([]); setOnlySaved(false); };
  const theme = () => { const r = document.documentElement; const d = !dark; r.dataset.theme = d ? "dark" : "light"; setDark(d); try { localStorage.setItem("rdt", r.dataset.theme); } catch {} };
  const lang = () => { const r = document.documentElement; const u = !ur; r.lang = u ? "ur" : "en"; r.dir = u ? "rtl" : "ltr"; setUr(u); try { localStorage.setItem("rdl", u ? "ur" : "en"); } catch {} };

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const [a, b] = bp ? bp.split("-").map(Number) : [0, 99];
    const by = sort === "v" ? (x: JobView, y: JobView) => (y.vacancies ?? 0) - (x.vacancies ?? 0) : (x: JobView, y: JobView) => x.lastDate.localeCompare(y.lastDate);
    return jobs.filter((j) => {
      if (ql && !(j.title + " " + j.department + " " + j.city).toLowerCase().includes(ql)) return false;
      if (pv && j.province !== pv) return false;
      if (bp && (j.bps == null || j.bps < a || j.bps > b)) return false;
      if (cl && left(j) > cl) return false;
      if (src.length && !src.includes(j.source)) return false;
      if (onlySaved && !saved.includes(j.id)) return false;
      return true;
    }).sort(by);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, q, pv, bp, cl, src, onlySaved, saved, sort, now]);
  const gov = filtered.filter((j) => isGov(j.source)); const news = filtered.filter((j) => !isGov(j.source));

  const Due = ({ j }: { j: JobView }) => { const n = left(j); return <span className={`due ${n <= 7 ? "hot" : n <= 14 ? "soon" : "ok"}`}>{n < 0 ? "Closed" : `${n} days left`}</span>; };
  const Sv = ({ j }: { j: JobView }) => <button className="sv" type="button" aria-pressed={saved.includes(j.id)} aria-label={`Save ${j.title}`} onClick={() => toggleSave(j.id)}><Bm /></button>;
  const Ob = ({ j }: { j: JobView }) => <button className="openb" type="button" onClick={() => setOpen(j)}>{j.title}</button>;
  const count = (s: string) => jobs.filter((j) => j.source === s).length;
  const scrollGov = () => document.getElementById("gov")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <a className="skip" href="#gov">Skip to jobs</a>
      <header className="nav"><div className="wrap">
        <a className="logo" href="#top"><svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#2FC79A" /><path d="M9 22V10h7.2c3 0 4.8 1.6 4.8 4s-1.8 4-4.8 4H13m4.5 0L22 22" stroke="#04251C" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>Rozgar Desk</a>
        <a className="l" href="#gov">Government jobs</a><a className="l" href="#papers">Newspaper jobs</a><a className="l" href="#alerts">Alerts</a>
        <span className="sp" />
        <button className="nb" type="button" onClick={lang} lang={ur ? "en" : "ur"}>{ur ? "English" : "اردو"}</button>
        <button className="nb h" type="button" onClick={theme} aria-pressed={dark}>{dark ? "Light" : "Dark"}</button>
        <a className="nb s" href="#alerts">Get alerts</a>
      </div></header>

      <main id="top">
        <section className="hero"><div className="wrap">
          <span className="tag"><span className="dot" />Checked against official advertisements</span>
          <h1>Government jobs, <em>found and verified.</em></h1>
          <p className="lede">FPSC, KPPSC, ETEA and major Urdu newspapers in one place, each linked to the official advertisement.</p>
          <p className="ur" lang="ur">سرکاری ملازمتیں، تصدیق کے ساتھ ایک جگہ</p>
          <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); scrollGov(); }}>
            <div className="fd"><label htmlFor="q">Job title or keyword</label><input id="q" type="search" placeholder="e.g. Teacher, Nurse, Inspector" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div className="fd"><label htmlFor="pv">Province</label><select id="pv" value={pv} onChange={(e) => setPv(e.target.value)}><option value="">All Pakistan</option><option>Khyber Pakhtunkhwa</option><option>Punjab</option><option>Federal</option></select></div>
            <div className="fd"><label htmlFor="bp">Pay scale</label><select id="bp" value={bp} onChange={(e) => setBp(e.target.value)}><option value="">Any BPS</option><option value="1-11">BPS 1 to 11</option><option value="12-16">BPS 12 to 16</option><option value="17-22">BPS 17 and above</option></select></div>
            <button className="go" type="submit">Search jobs</button>
          </form>
          <div className="quick"><span>Popular:</span>{["Teacher", "Nurse", "Inspector", "Peshawar"].map((w) => <button key={w} type="button" onClick={() => { setQ(w); scrollGov(); }}>{w}</button>)}</div>
        </div></section>

        <section className="strip wrap" aria-label="Open jobs by source"><div className="sg">
          {([["FPSC", "Federal"], ["KPPSC", "Khyber Pakhtunkhwa"], ["ETEA", "Khyber Pakhtunkhwa testing service"]] as const).map(([s, t]) => <div key={s} className="st" style={{ ["--c" as string]: `var(${COL[s]})` } as React.CSSProperties}><b>{s}</b><span className="n">{count(s)}</span><small>open jobs, {t}</small></div>)}
          <div className="st" style={{ ["--c" as string]: "var(--news)" } as React.CSSProperties}><b>Newspapers</b><span className="n">{jobs.filter((j) => !isGov(j.source)).length}</span><small>open jobs, Aaj, Jang, Nawa-i-Waqt, Mashriq</small></div>
        </div></section>

        <div className="wrap main">
          <aside className="rail" aria-label="Filters">
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="rh">Closing</legend>
              {[[0, "Any time"], [10, "Within 10 days"], [21, "Within 3 weeks"]].map(([v, l]) => <label key={v} className="opt"><input type="radio" name="cl" checked={cl === v} onChange={() => setCl(v as number)} />{l}</label>)}
            </fieldset>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="rh">Source</legend>
              {ALL_SOURCES.map((s) => <label key={s} className="opt" style={cv(s)}><input type="checkbox" checked={src.includes(s)} onChange={(e) => setSrc((x) => e.target.checked ? [...x, s] : x.filter((y) => y !== s))} /><span className="sw" />{s}<span className="c">{count(s)}</span></label>)}
            </fieldset>
            <div><span className="rh">Show</span><label className="opt"><input type="checkbox" checked={onlySaved} onChange={(e) => setOnlySaved(e.target.checked)} />Saved jobs only</label></div>
            <button className="rs" type="button" onClick={reset}>Clear filters</button>
          </aside>

          <div>
            <section id="gov" aria-live="polite">
              <div className="bar"><h2>Government jobs</h2><span className="ct">{gov.length} {gov.length === 1 ? "job" : "jobs"}</span>
                <label className="sr" htmlFor="so">Sort</label><select id="so" value={sort} onChange={(e) => setSort(e.target.value)}><option value="d">Closing soonest</option><option value="v">Most vacancies</option></select></div>
              <div className="grid">
                {gov.length ? gov.map((j) => (
                  <article key={j.id} className="card" style={cv(j.source)}>
                    <div className="cap"><span>{j.source} · {j.province}</span><span className={j.verified ? "ver" : "smp"}>{j.verified ? "Verified" : sample ? "Sample" : "Unverified"}</span></div>
                    <div className="cb"><div><h3><Ob j={j} /></h3><div className="org">{j.department}</div></div>
                      <div className="meta"><span>{j.city}</span><span>{j.vacancies} vacancies</span><span>Last date {fd(j.lastDate)}</span></div>
                      <div className="ft"><span style={{ display: "flex", gap: 8, alignItems: "center" }}><span className="bps">BPS-{j.bps}</span><Due j={j} /></span><Sv j={j} /></div></div>
                  </article>)) : <div className="empty">No government jobs match. Try clearing a filter.</div>}
              </div>
            </section>

            <section className="paper" id="papers" aria-live="polite">
              <div className="mast"><div><h2>Newspaper Jobs</h2><div className="u" lang="ur">اخبارات میں شائع ملازمتیں</div></div><span style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>{news.length} {news.length === 1 ? "notice" : "notices"}</span></div>
              <div className="pcols">
                {news.length ? news.map((j) => (
                  <article key={j.id} className="ad"><div className="k">{j.source} · {j.province}</div><h3><Ob j={j} /></h3><div className="o">{j.department}</div>
                    <div className="m"><b>{j.vacancies} posts</b> in {j.city}. {j.education}. Apply by <b>{fd(j.lastDate)}</b>.</div>
                    <div className="r"><span className="bps">BPS-{j.bps}</span><Due j={j} /><Sv j={j} /></div></article>)) : <div className="empty">No newspaper notices match these filters.</div>}
              </div>
            </section>

            <div className="alert" id="alerts"><div><h3>Never miss a closing date</h3><p>Get an email when a new advertisement matches your search. No account needed.</p></div>
              <form onSubmit={async (e) => { e.preventDefault(); const em = (e.currentTarget.elements.namedItem("em") as HTMLInputElement).value; setMsg("Sending...");
                try { const r = await fetch("/api/alerts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: em, query: { q: q || undefined, province: pv || undefined, bps: bp || undefined } }) }); const d = await r.json();
                  setMsg(r.ok ? (d.emailSent ? "Check your inbox to confirm your alert." : d.note ?? "Saved.") : d.error ?? "Something went wrong."); } catch { setMsg("Network error. Try again."); } }}>
                <label className="sr" htmlFor="em">Email</label><input id="em" name="em" type="email" placeholder="you@example.com" required /><button className="go" type="submit">Notify me</button></form></div>
            <p className="nt" role="status" style={{ margin: "10px 4px 0" }}>{msg}</p>
          </div>
        </div>
      </main>
      <footer><div className="wrap"><span>{sample ? "Sample listings for design review, not real advertisements. " : ""}Always confirm details on the official advertisement.</span><span>Sources: FPSC, KPPSC, ETEA</span></div></footer>

      <dialog ref={dlg} aria-labelledby="dT" onClose={() => { setOpen(null); lastFocus.current?.focus(); }} onClick={(e) => { if (!(e.target as HTMLElement).closest(".sheet")) dlg.current?.close(); }}>
        {open && <div className="sheet">
          <header><h2 id="dT">{open.title}</h2><button ref={closeBtn} className="sv" type="button" aria-label="Close" onClick={() => dlg.current?.close()}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></header>
          <div className="bd"><p className="nt">{open.department}.{open.verified ? "" : sample ? " Sample listing for design review." : " Not yet verified. Confirm every detail on the official advertisement."}</p>
            <div className="fc">{[["Last date", fd(open.lastDate)], ["Time left", `${left(open)} days`], ["Pay scale", `BPS-${open.bps}`], ["Vacancies", String(open.vacancies)], ["Education", open.education], ["Age", open.age], ["Location", open.city], ["Source", open.source]].map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}</div>
            {open.verified && <div className="vf"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg><div><b>Checked against the official advertisement.</b><br />Details match the {open.source} notice. Confirm eligibility in the original ad before applying.</div></div>}
            <div><h3 style={{ fontSize: 17, marginBottom: 10 }}>How to apply</h3><ol><li>Read the eligibility in the official advertisement.</li><li>Apply on the {open.source} portal before the last date.</li><li>Keep documents and fee receipt ready.</li></ol></div>
            <a className="cta" href={open.officialUrl} target="_blank" rel="noopener noreferrer" style={{ textAlign: "center", textDecoration: "none", display: "grid", placeItems: "center" }}>Open official advertisement</a>
            <p className="nt">Rozgar Desk links to the official source and does not accept applications.</p></div>
        </div>}
      </dialog>
    </>
  );
}
