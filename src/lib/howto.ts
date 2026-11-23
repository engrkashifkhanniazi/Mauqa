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

/** Longer step-by-step guide by source type, shown in a collapsible block under the short summary. General guidance only. */
export function steps(source: string): Lang[] {
  if (TESTING.includes(source)) return [
    { en: `Open the ${source} website and find this advertisement by its title or number.`, ur: `${source} کی ویب سائٹ کھولیں اور یہ اشتہار عنوان یا نمبر سے تلاش کریں۔` },
    { en: "Create an account or log in, then fill the online form carefully (name exactly as on your CNIC).", ur: "اکاؤنٹ بنائیں یا لاگ اِن کریں، پھر آن لائن فارم احتیاط سے بھریں (نام بالکل شناختی کارڈ کے مطابق)۔" },
    { en: "Generate the fee challan, pay it at the bank named in the ad (or online if allowed), and keep the receipt.", ur: "فیس کا چالان بنائیں، اشتہار میں بتائے گئے بینک میں (یا اجازت ہو تو آن لائن) جمع کرائیں اور رسید رکھیں۔" },
    { en: "Upload your photo and the documents the form asks for, then submit before the last date.", ur: "تصویر اور فارم میں مانگے گئے کاغذات اپ لوڈ کریں اور آخری تاریخ سے پہلے جمع کرائیں۔" },
    { en: "Download your roll number slip when it is issued and prepare for the written test.", ur: "رول نمبر سلپ جاری ہونے پر ڈاؤن لوڈ کریں اور تحریری ٹیسٹ کی تیاری کریں۔" },
  ];
  if (COMMISSION.includes(source)) return [
    { en: `Read the full advertisement on the ${source} website, especially eligibility, age limit and domicile quota.`, ur: `${source} کی ویب سائٹ پر پورا اشتہار پڑھیں، خاص طور پر اہلیت، عمر کی حد اور ڈومیسائل کوٹہ۔` },
    { en: "Register or log in and fill the online application for this case or post number.", ur: "رجسٹر یا لاگ اِن کریں اور اس کیس یا آسامی نمبر کے لیے آن لائن درخواست بھریں۔" },
    { en: "Pay the application fee in the way the commission explains and keep the receipt.", ur: "کمیشن کے بتائے طریقے سے فیس جمع کرائیں اور رسید سنبھال کر رکھیں۔" },
    { en: "Submit before the closing date and print a copy of your application.", ur: "آخری تاریخ سے پہلے جمع کرائیں اور درخواست کی کاپی پرنٹ کر لیں۔" },
    { en: "Watch the commission website for the test or interview schedule.", ur: "ٹیسٹ یا انٹرویو کے شیڈول کے لیے کمیشن کی ویب سائٹ دیکھتے رہیں۔" },
  ];
  return [
    { en: "Read the advertisement picture: post, qualification, age, domicile, fee and last date.", ur: "اشتہار کی تصویر پڑھیں: عہدہ، تعلیم، عمر، ڈومیسائل، فیس اور آخری تاریخ۔" },
    { en: "Prepare the application exactly as asked: on plain paper, on the prescribed form, or online.", ur: "درخواست بالکل اشتہار کے مطابق تیار کریں: سادہ کاغذ پر، مقررہ فارم پر یا آن لائن۔" },
    { en: "Attach attested copies of your documents. If sending by post, write the post name on the envelope's top-left corner.", ur: "کاغذات کی تصدیق شدہ کاپیاں لگائیں۔ ڈاک سے بھیجیں تو لفافے کے اوپر بائیں کونے پر عہدے کا نام لکھیں۔" },
    { en: "Send it by registered post or courier, or submit by hand, to the address in the ad before the last date.", ur: "آخری تاریخ سے پہلے اشتہار کے پتے پر رجسٹرڈ ڈاک، کورئیر یا خود جا کر جمع کرائیں۔" },
    { en: "Keep the postal receipt. Usually only shortlisted candidates are called for a test or interview.", ur: "ڈاک کی رسید سنبھال کر رکھیں۔ عموماً صرف شارٹ لسٹ امیدواروں کو ٹیسٹ یا انٹرویو کے لیے بلایا جاتا ہے۔" },
  ];
}
/** Pre-apply checklist. */
export const CHECKLIST: Lang[] = [
  { en: "CNIC (copy, both sides)", ur: "شناختی کارڈ کی کاپی (دونوں طرف)" },
  { en: "Domicile certificate", ur: "ڈومیسائل سرٹیفکیٹ" },
  { en: "Attested degrees, certificates and mark sheets (DMCs)", ur: "تصدیق شدہ اسناد، سرٹیفکیٹ اور رزلٹ کارڈ" },
  { en: "Recent passport-size photographs (usually blue or white background)", ur: "حالیہ پاسپورٹ سائز تصاویر (عموماً نیلا یا سفید پس منظر)" },
  { en: "Experience certificate, if the post asks for experience", ur: "تجربے کا سرٹیفکیٹ، اگر آسامی کے لیے تجربہ مانگا گیا ہو" },
  { en: "Paid fee challan or bank receipt, if a fee applies", ur: "فیس کا ادا شدہ چالان یا بینک رسید، اگر فیس ہو" },
  { en: "NOC from your department, if you are already a government employee", ur: "اگر آپ پہلے سے سرکاری ملازم ہیں تو محکمے کا این او سی" },
];
