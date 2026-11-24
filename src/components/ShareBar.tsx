"use client";
import { useEffect, useState } from "react";
/** WhatsApp share (ready-made message), native share where available, copy link.
 *  With `pic` (URL of the ad picture): phones that can share files get a "Share with picture" button (picture + message in one go,
 *  so it can be sent straight to a chat or channel); other browsers get a "Save picture" link. */
export default function ShareBar({ url, title, dept, last, pic }: { url: string; title: string; dept: string; last: string; pic?: string }) {
  const [copied, setCopied] = useState(false); const [can, setCan] = useState(false);
  const [file, setFile] = useState<File | null>(null); const [files, setFiles] = useState(false);
  useEffect(() => {
    setCan(typeof navigator !== "undefined" && "share" in navigator);
    if (!pic || typeof navigator === "undefined" || typeof navigator.canShare !== "function") return;
    let dead = false;
    try { if (!navigator.canShare({ files: [new File(["x"], "a.jpg", { type: "image/jpeg" })] })) return; } catch { return; }
    setFiles(true);
    // Load the picture ahead of the tap: sharing must start straight from the tap or the browser refuses.
    fetch(pic).then((r) => (r.ok ? r.blob() : Promise.reject())).then((b) => { if (!dead) setFile(new File([b], "mauqa-job-ad.jpg", { type: b.type || "image/jpeg" })); }).catch(() => {});
    return () => { dead = true; };
  }, [pic]);
  const msg = `*${title}*${dept ? `\n${dept}` : ""}${last ? `\nLast date: ${last}` : ""}\n\nDetails and advertisement:\n${url}`;
  const native = async () => { try { await navigator.share({ title, text: msg.replace(/\n+.*$/, ""), url }); } catch {} };
  const withPic = async () => { if (file) { try { await navigator.share({ files: [file], text: msg }); } catch {} } };
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} };
  return (<div className="sh">
    <a className="sh-wa" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer">
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z"/></svg>
      <span className="t-en">Share on WhatsApp</span><span className="t-ur" lang="ur">واٹس ایپ پر بھیجیں</span></a>
    {pic && files && <button type="button" className="sh-b" onClick={withPic} disabled={!file}><span className="t-en">{file ? "Share with picture" : "Loading picture..."}</span><span className="t-ur" lang="ur">{file ? "تصویر کے ساتھ بھیجیں" : "تصویر آ رہی ہے..."}</span></button>}
    {pic && !files && <a className="sh-b" href={pic} download="mauqa-job-ad.jpg" style={{ textDecoration: "none" }}><span className="t-en">Save picture</span><span className="t-ur" lang="ur">تصویر محفوظ کریں</span></a>}
    {can && <button type="button" className="sh-b" onClick={native}><span className="t-en">Share</span><span className="t-ur" lang="ur">شیئر</span></button>}
    <button type="button" className="sh-b" onClick={copy}>{copied ? <><span className="t-en">Link copied</span><span className="t-ur" lang="ur">لنک کاپی ہو گیا</span></> : <><span className="t-en">Copy link</span><span className="t-ur" lang="ur">لنک کاپی کریں</span></>}</button>
  </div>);
}
