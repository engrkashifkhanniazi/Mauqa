import { WA_CHANNEL } from "@/lib/site";
/** "Follow on WhatsApp" link. Hidden until NEXT_PUBLIC_WHATSAPP_CHANNEL is set. */
export default function Follow() {
  if (!WA_CHANNEL) return null;
  return (<a className="fol" href={WA_CHANNEL} target="_blank" rel="noopener noreferrer">
    <span className="t-en">Get new jobs daily on our WhatsApp channel</span><span className="t-ur" lang="ur">روزانہ نئی نوکریاں ہمارے واٹس ایپ چینل پر پائیں</span><b aria-hidden="true">›</b></a>);
}
