"use client";
import { useEffect, useState } from "react";
/** Same browser storage key as the homepage list, so a job saved here shows as saved there too. */
export default function SaveJob({ id }: { id: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => { try { setOn((JSON.parse(localStorage.getItem("rdf") || "[]") as number[]).includes(id)); } catch {} }, [id]);
  const toggle = () => { try { const s = JSON.parse(localStorage.getItem("rdf") || "[]") as number[]; const n = s.includes(id) ? s.filter((x) => x !== id) : [...s, id]; localStorage.setItem("rdf", JSON.stringify(n)); setOn(n.includes(id)); } catch {} };
  return (<button type="button" className="sv-j" aria-pressed={on} onClick={toggle}>
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
    {on ? <><span className="t-en">Saved</span><span className="t-ur" lang="ur">محفوظ ہے</span></> : <><span className="t-en">Save job</span><span className="t-ur" lang="ur">محفوظ کریں</span></>}</button>);
}
