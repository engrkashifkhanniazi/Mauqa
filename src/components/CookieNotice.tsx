"use client";
import { useEffect, useState } from "react";
/** First-visit notice about cookies (ads) and local storage. Dismissal is remembered in this browser. */
export default function CookieNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => { try { if (!localStorage.getItem("mq_ck")) setShow(true); } catch {} }, []);
  if (!show) return null;
  const ok = () => { try { localStorage.setItem("mq_ck", "1"); } catch {} setShow(false); };
  return (<div className="ck" role="region" aria-label="Cookie notice">
    <p><span className="t-en">We use cookies to show ads and remember your choices. </span><span className="t-ur" lang="ur">ہم اشتہارات دکھانے اور آپ کی پسند یاد رکھنے کے لیے کوکیز استعمال کرتے ہیں۔ </span><a href="/privacy"><span className="t-en">Privacy policy</span><span className="t-ur" lang="ur">پرائیویسی پالیسی</span></a></p>
    <button type="button" onClick={ok}><span className="t-en">OK</span><span className="t-ur" lang="ur">ٹھیک ہے</span></button></div>);
}
