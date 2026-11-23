"use client";
import { useRef, useState } from "react";

/** Picks the saved ad picture and shrinks it on the phone first, so large photos pass the upload size limit. */
export default function AdImageInput() {
  const ref = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return setNote("");
    try {
      const bmp = await createImageBitmap(f);
      const k = Math.min(1, 1800 / bmp.width);
      const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
      const blob: Blob = await new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error("x"))), "image/jpeg", 0.85));
      const dt = new DataTransfer(); dt.items.add(new File([blob], "ad.jpg", { type: "image/jpeg" })); e.target.files = dt.files;
      setNote(`Ready: ${(blob.size / 1024).toFixed(0)} KB`);
    } catch { setNote(f.size > 4_000_000 ? "Picture is too big; pick a smaller one." : "Picture attached."); }
  }
  return (<label htmlFor="add-adImage">Ad picture (optional) · drop or tap to choose, shrinks automatically<input ref={ref} id="add-adImage" name="adImage" type="file" accept="image/*" onChange={onPick} style={{ display: "block", width: "100%" }} /><span className="nt">{note}</span></label>);
}
