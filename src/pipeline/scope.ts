/** Product scope (Nov 2026): Khyber Pakhtunkhwa + Islamabad (incl. federal bodies). Other provinces are skipped. */
const IN = /\b(islamabad|ict|peshawar|khyber|pakhtunkhwa|kpk|k\.p\.k|kp\b|abbottabad|mardan|swat|bannu|kohat|dera ismail khan|d\.?i\.? ?khan|swabi|nowshera|charsadda|mansehra|haripur|lakki marwat|chitral|dir\b|malakand|buner|hangu|karak|tank|waziristan|bajaur|mohmand|khyber|kurram|orakzai|shangla|battagram|kolai|torghar|federal|ministry|government of pakistan|fbr|nadra|pakistan post)\b|پشاور|خیبر|اسلام آباد|بنوں|مردان|سوات|ایبٹ آباد|کوہاٹ/i;
const OUT = /\b(lahore|punjab|multan|faisalabad|rawalpindi|gujranwala|sialkot|bahawalpur|sargodha|karachi|sindh|hyderabad|sukkur|larkana|quetta|balochistan|baloch|gwadar|gilgit|baltistan|azad|ajk|jammu|kashmir|muzaffarabad|mirpur|kamra|attock|jhelum|chakwal|sahiwal|okara|kasur|sheikhupura|gujrat|jhang|sukkur|thatta|nawabshah|tando|mirpurkhas|jacobabad|shikarpur|khairpur|dadu|badin|turbat|khuzdar|zhob|sibi|fesco|gepco|lesco|iesco|mepco|pesco)\b|لاہور|پنجاب|کراچی|سندھ|کوئٹہ|بلوچستان|گلگت|کشمیر/i;
export type ScopeVerdict = { inScope: boolean; reason: string };
/**
 * Deterministic region check on title/department/city text.
 * Any KP/Islamabad/federal signal keeps the job. Otherwise another province's name rejects it.
 * No location signal at all keeps it (federal ads often omit the city) so nothing is hidden by guesswork.
 */
export function checkScope(...parts: (string | null | undefined)[]): ScopeVerdict {
  const t = parts.filter(Boolean).join(" ");
  if (IN.test(t)) return { inScope: true, reason: "kp-or-islamabad-or-federal" };
  if (OUT.test(t)) return { inScope: false, reason: "outside Khyber Pakhtunkhwa and Islamabad" };
  return { inScope: true, reason: "no location stated" };
}
