/** Site-wide settings. NEXT_PUBLIC_* values are read at build time; set them in Vercel and redeploy. */
export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mauqa.vercel.app";
export const SITE_HOST = SITE.replace(/^https?:\/\//, "").replace(/\/$/, "");
export const NAME = "Mauqa";
export const NAME_UR = "موقع";
/** e.g. ca-pub-1234567890123456. Empty = no ads, no AdSense script, ad slots render nothing. */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
/** Ad unit ids per position (from AdSense > Ads > By ad unit). Empty slot id = that position stays off. */
export const AD_SLOTS = {
  listTop: process.env.NEXT_PUBLIC_AD_SLOT_LIST_TOP ?? "",
  listFeed: process.env.NEXT_PUBLIC_AD_SLOT_LIST_FEED ?? "",
  jobFacts: process.env.NEXT_PUBLIC_AD_SLOT_JOB_FACTS ?? "",
  jobMid: process.env.NEXT_PUBLIC_AD_SLOT_JOB_MID ?? "",
  jobEnd: process.env.NEXT_PUBLIC_AD_SLOT_JOB_END ?? "",
};
export const WA_CHANNEL = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL ?? "";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";
