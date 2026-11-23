/** Short general guidance, used only when the admin has not typed the advertisement's own "how to apply".
 *  Kept brief and clearly labelled as general, so it never contradicts a specific advertisement. */
type Lang = { en: string; ur: string };
export interface HowTo { mode: Lang; docs: Lang; remember: Lang }
const TESTING = ["NTS", "OTS", "PTS", "ATS", "ETEA"];
const COMMISSION = ["FPSC", "KPPSC", "PPSC", "SPSC", "BPSC"];
const docs: Lang = { en: "CNIC, domicile, educational certificates and photos. Experience certificate and fee receipt if the ad asks.", ur: "شناختی کارڈ، ڈومیسائل، تعلیمی اسناد اور تصاویر۔ اشتہار میں مانگا ہو تو تجربے کا سرٹیفکیٹ اور فیس کی رسید۔" };
const remember: Lang = { en: "Check the age limit and domicile rule, apply before the last date, and never pay anyone who promises a job.", ur: "عمر کی حد اور ڈومیسائل کی شرط دیکھیں، آخری تاریخ سے پہلے درخواست دیں، اور نوکری کا وعدہ کرنے والے کسی کو پیسے نہ دیں۔" };
export function howTo(source: string): HowTo {
  if (TESTING.includes(source) || COMMISSION.includes(source)) return { docs, remember, mode: { en: `Usually online on the ${source} website: fill the form, pay the fee, submit before the last date.`, ur: `عموماً ${source} کی ویب سائٹ پر آن لائن: فارم بھریں، فیس جمع کرائیں، آخری تاریخ سے پہلے جمع کریں۔` } };
  return { docs, remember, mode: { en: "Exactly as written in the newspaper advertisement (online, on a form, or by post to the address given).", ur: "بالکل جیسا اخباری اشتہار میں لکھا ہے (آن لائن، فارم پر، یا دیے گئے پتے پر بذریعہ ڈاک)۔" } };
}
