/** Original, general guidance shown on every job page. Always tells the reader to follow the official advertisement first. */
type Lang = { en: string; ur: string };
export interface HowTo { mode: Lang; steps: Lang[]; docs: Lang[]; tips: Lang[] }
const TESTING = ["NTS", "OTS", "PTS", "ATS", "ETEA"];
const COMMISSION = ["FPSC", "KPPSC", "PPSC", "SPSC", "BPSC"];
const docs: Lang[] = [
  { en: "CNIC (copy, both sides)", ur: "شناختی کارڈ کی کاپی (دونوں طرف)" },
  { en: "Domicile certificate", ur: "ڈومیسائل سرٹیفکیٹ" },
  { en: "Educational certificates and mark sheets", ur: "تعلیمی اسناد اور رزلٹ کارڈ" },
  { en: "Experience certificate, if the post asks for it", ur: "تجربے کا سرٹیفکیٹ، اگر مانگا گیا ہو" },
  { en: "Recent passport-size photographs", ur: "حالیہ پاسپورٹ سائز تصاویر" },
  { en: "Fee deposit slip or challan, if a fee applies", ur: "فیس جمع کرانے کی رسید یا چالان، اگر فیس ہو" },
];
const tips: Lang[] = [
  { en: "Check the domicile/zone rule: many posts are only for one province or district.", ur: "ڈومیسائل کی شرط دیکھیں: بہت سی آسامیاں صرف ایک صوبے یا ضلع کے لیے ہوتی ہیں۔" },
  { en: "Age is counted on the closing date. Government rules usually allow age relaxation; the ad states how much.", ur: "عمر آخری تاریخ کے حساب سے گنی جاتی ہے۔ سرکاری قواعد میں عمر میں رعایت ہوتی ہے، تفصیل اشتہار میں ہوتی ہے۔" },
  { en: "Government employees usually apply through proper channel with an NOC.", ur: "سرکاری ملازمین عموماً محکمے کے ذریعے اور این او سی کے ساتھ درخواست دیتے ہیں۔" },
  { en: "Apply a few days early. Incomplete or late applications are usually rejected.", ur: "آخری دن کا انتظار نہ کریں۔ نامکمل یا دیر سے آنے والی درخواستیں عموماً مسترد ہو جاتی ہیں۔" },
  { en: "Never pay anyone who promises a job. Only the fee stated in the official ad is genuine.", ur: "نوکری کا وعدہ کرنے والے کسی شخص کو پیسے نہ دیں۔ صرف اشتہار میں لکھی فیس اصل ہے۔" },
];
export function howTo(source: string): HowTo {
  if (TESTING.includes(source)) return { docs, tips, mode: { en: `Online, through the ${source} website`, ur: `آن لائن، ${source} کی ویب سائٹ کے ذریعے` }, steps: [
    { en: `Open the ${source} website and find this advertisement by its title or number.`, ur: `${source} کی ویب سائٹ کھولیں اور اس اشتہار کو عنوان یا نمبر سے تلاش کریں۔` },
    { en: "Create an account (or log in) and fill the online form carefully.", ur: "اکاؤنٹ بنائیں یا لاگ ان کریں اور آن لائن فارم احتیاط سے بھریں۔" },
    { en: "Print the fee challan and pay it at the named bank, then upload or enter the receipt details.", ur: "فیس کا چالان پرنٹ کر کے بتائے گئے بینک میں جمع کرائیں اور رسید کی تفصیل درج کریں۔" },
    { en: "Upload the documents and photo the form asks for, and submit before the last date.", ur: "فارم میں مانگے گئے کاغذات اور تصویر اپ لوڈ کریں اور آخری تاریخ سے پہلے جمع کرائیں۔" },
    { en: "Download your roll number slip when it is issued and prepare for the written test.", ur: "رول نمبر سلپ جاری ہونے پر ڈاؤن لوڈ کریں اور تحریری ٹیسٹ کی تیاری کریں۔" },
  ] };
  if (COMMISSION.includes(source)) return { docs, tips, mode: { en: `Online, on the ${source} website`, ur: `آن لائن، ${source} کی ویب سائٹ پر` }, steps: [
    { en: `Read the full advertisement on the ${source} website, including eligibility and age limit.`, ur: `${source} کی ویب سائٹ پر پورا اشتہار پڑھیں، خاص طور پر اہلیت اور عمر کی حد۔` },
    { en: "Register or log in, then fill the online application for this case number.", ur: "رجسٹر یا لاگ ان کریں اور اس کیس نمبر کے لیے آن لائن درخواست بھریں۔" },
    { en: "Pay the application fee as the commission explains and keep the receipt.", ur: "کمیشن کے بتائے طریقے سے فیس جمع کرائیں اور رسید سنبھال کر رکھیں۔" },
    { en: "Submit before the closing date and print a copy of your application.", ur: "آخری تاریخ سے پہلے جمع کرائیں اور درخواست کی کاپی پرنٹ کر لیں۔" },
    { en: "Watch the website for test or interview schedules.", ur: "ٹیسٹ یا انٹرویو کے شیڈول کے لیے ویب سائٹ دیکھتے رہیں۔" },
  ] };
  return { docs, tips, mode: { en: "As written in the newspaper advertisement", ur: "جیسا اخباری اشتہار میں لکھا ہے" }, steps: [
    { en: "Read the advertisement picture below: post, qualification, age, domicile and last date.", ur: "نیچے اشتہار کی تصویر غور سے پڑھیں: عہدہ، تعلیم، عمر، ڈومیسائل اور آخری تاریخ۔" },
    { en: "Prepare the application as the ad says: on plain paper, on a prescribed form, or online.", ur: "درخواست اشتہار کے مطابق تیار کریں: سادہ کاغذ پر، مقررہ فارم پر یا آن لائن۔" },
    { en: "Attach attested copies of the documents listed below.", ur: "نیچے دیے گئے کاغذات کی تصدیق شدہ کاپیاں ساتھ لگائیں۔" },
    { en: "Send or submit it to the address in the ad before the last date (registered post or by hand).", ur: "آخری تاریخ سے پہلے اشتہار میں دیے گئے پتے پر بھیجیں یا خود جمع کرائیں (رجسٹرڈ ڈاک یا دستی)۔" },
    { en: "Keep the postal receipt. Only shortlisted candidates are usually called for test or interview.", ur: "ڈاک کی رسید سنبھال کر رکھیں۔ عموماً صرف شارٹ لسٹ امیدواروں کو ٹیسٹ یا انٹرویو کے لیے بلایا جاتا ہے۔" },
  ] };
}
