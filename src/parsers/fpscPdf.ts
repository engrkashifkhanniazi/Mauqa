/** Parses the OCR text of an FPSC "Consolidated Advertisement" PDF (scanned image, no text layer) into one record per post.
 *  Pure + deterministic. Only structured facts are kept (no qualification/ad text is copied). OCR is imperfect, so every
 *  field is optional and the closing date of each post is cross-checked against the ad-level date. */
export interface FpscPost {
  caseNo: string; title: string; bps: number | null; department: string | null; vacancies: number | null;
  ageMin: number | null; ageMax: number | null; city: string | null; closingDate: string | null; dateConflict: boolean;
}
export interface FpscAd { publishedDate: string | null; closingDate: string | null; posts: FpscPost[] }

const MONTHS: Record<string, number> = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
const CITIES = ["Islamabad", "Rawalpindi", "Lahore", "Karachi", "Peshawar", "Quetta", "Muzaffarabad", "Gilgit", "Faisalabad", "Multan", "Hyderabad"];
const iso = (y: number, m: number, d: number) => (m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : null);
const NUMW: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

function dateLong(s: string): string | null {
  const m = s.match(/(\d{1,2})\s*[^\w\s]{0,3}\s*(?:st|nd|rd|th)?\s*,?\s*(January|February|March|April|May|June|July|August|September|October|November|December),?\s*(\d{4})/i);
  return m ? iso(+m[3], MONTHS[m[2].toLowerCase()], +m[1]) : null;
}
function dateNumeric(s: string): string | null {
  const m = s.match(/(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*(\d{4})/); return m ? iso(+m[3], +m[2], +m[1]) : null;
}
const tidy = (s: string) => s.replace(/[|_~—\-:]{1,}\s*$/g, "").replace(/\s+/g, " ").trim();
const titleCase = (s: string) => s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\b(Bs|Hec|Pmdc)\b/g, (w) => w.toUpperCase());

function dept(raw: string): string | null {
  let t = raw.replace(/\bDepartment\b/gi, " ").replace(/[|_~]/g, " ").replace(/\s+\/\s*/g, " ").replace(/\s+/g, " ").trim();
  t = t.split(/[\[\]—–]/)[0].trim();
  const paren = t.match(/^(.*?\([A-Z]{2,8}\))/); if (paren) t = paren[1];
  else if (t.length > 70) t = t.slice(0, 70).replace(/\s+\S*$/, "");
  t = t.replace(/^[^A-Za-z]+/, "").replace(/[^A-Za-z)]+$/, "").trim();
  return /[A-Za-z]{4}/.test(t) && t.length >= 4 ? t : null;
}

export function parseFpscAd(text: string): FpscAd {
  const t = text.replace(/\r/g, "");
  const published = dateLong((t.match(/Islamabad,?\s*the\s*([^\n]{5,40})/i) ?? [])[1] ?? "");
  const up = t.match(/apply\s+on-?line\s+up\s*to\s+([^\n|]{6,40})/i);
  const adClosing = up ? dateLong(up[1]) : null;
  const parts = t.split(/\n\s*\d+\s*\.\s*[~\-_ ]*Case\s*No\.?\s*/i).slice(1);
  const posts: FpscPost[] = [];
  for (const chunk of parts) {
    const caseNo = (chunk.match(/^\s*(F\.?\s*[\d-]+\/\d{4}-R)/i) ?? [])[1]?.replace(/\s+/g, "");
    const tm = chunk.match(/Post\s+with\s+pay\s+scale[\s|:\-~_]*([A-Za-z][A-Za-z ,/&.\-]{2,80}?)\s*\(\s*BS\s*-?\s*(\d{1,2})\s*\)/i);
    if (!caseNo || !tm) continue;
    const dm = chunk.match(/Ministry\s*\/?\s*Division\s*\/?([\s\S]*?)Minimum/i);
    const vm = chunk.match(/Vacancies[\s|_~:.-]{0,8}(?:([A-Za-z]+)\s*\(\s*(\d+)\s*\)|(\d+))/i);
    const vacancies = vm ? (vm[2] ? +vm[2] : vm[3] ? +vm[3] : NUMW[vm[1]?.toLowerCase()] ?? null) : null;
    const am = chunk.match(/(?:Age\s*Limit|Maximum\s*Age)[\s|_~:.-]{0,8}(?:(\d{2})\s*-\s*)?(\d{2})\s*years/i);
    const pl = chunk.match(/Place\s+of\s+posting[\s|_~:.-]{0,8}([^\n]{0,60})/i);
    const city = pl ? CITIES.find((c) => new RegExp(c, "i").test(pl[1])) ?? null : null;
    const cd = chunk.match(/Closing\s*date[\s|_~:.-]{0,8}([^\n]{0,20})/i);
    const closing = cd ? dateNumeric(cd[1]) : null;
    posts.push({
      caseNo, title: titleCase(tidy(tm[1])), bps: +tm[2], department: dm ? dept(dm[1]) : null, vacancies,
      ageMin: am?.[1] ? +am[1] : null, ageMax: am ? +am[2] : null, city, closingDate: closing ?? adClosing,
      dateConflict: !!(closing && adClosing && closing !== adClosing),
    });
  }
  return { publishedDate: published, closingDate: adClosing, posts };
}
