import Doc from "@/components/Doc";
import { CONTACT_EMAIL, WA_CHANNEL } from "@/lib/site";
export const metadata = { title: "Contact", description: "Contact Mauqa to report a mistake in a job listing or ask a question." };
export default function Contact() { return (<Doc title="Contact us" ur="کسی نوکری میں غلطی ہو یا کوئی سوال ہو تو ہمیں ای میل کریں۔ ہم درخواستیں وصول نہیں کرتے؛ درخواست ہمیشہ اشتہار میں دیے گئے ادارے کو دیں۔">
  {CONTACT_EMAIL ? <p>Email: <a href={`mailto:${CONTACT_EMAIL}`}><b>{CONTACT_EMAIL}</b></a></p> : <p>Our contact email is being set up. Please check back shortly.</p>}
  {WA_CHANNEL && <p>Daily job updates: <a href={WA_CHANNEL} target="_blank" rel="noopener noreferrer">Mauqa WhatsApp channel</a></p>}
  <h2>Please write to us about</h2>
  <ul><li>A wrong last date, pay scale or other detail in a listing (send the page link).</li><li>A government job advertisement we have missed.</li><li>Removing your email address from job alerts.</li><li>Anything else about the website.</li></ul>
  <h2>We cannot help with</h2>
  <p>Submitting applications, test results, roll number slips or appointment letters. Please contact the department or testing service named in the advertisement for these.</p>
  <p>We usually reply within two working days.</p></Doc>); }
