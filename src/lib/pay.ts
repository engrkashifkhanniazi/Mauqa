/** Government of Pakistan, Finance Division: Revised Basic Pay Scales 2026 (O.M. F.1(2)IMP/2026, 21 July 2026, effective 1 July 2026).
 *  Minimum and maximum monthly BASIC pay in rupees. Allowances (house rent, conveyance, medical, ad-hoc relief) are extra and vary. */
export const BPS_2026: Record<number, [number, number]> = {
  1: [16280, 31880], 2: [16600, 34300], 3: [17130, 38130], 4: [17650, 41650], 5: [18300, 45600], 6: [18930, 49230], 7: [19590, 52590], 8: [20290, 56590],
  9: [20990, 60290], 10: [21680, 64580], 11: [22410, 69810], 12: [23750, 75350], 13: [25420, 81820], 14: [27060, 89760], 15: [28730, 100130], 16: [33720, 115320],
  17: [54140, 136340], 18: [68330, 170730], 19: [105510, 214510], 20: [123090, 235650], 21: [136680, 261560], 22: [146770, 293350],
};
export const PAY_SOURCE = "https://www.finance.gov.pk/circulars/REVISION_OF_BASIC_PAY_SCALES_2026.pdf";
const n = (x: number) => x.toLocaleString("en-PK");
export const payRange = (bps: number | null) => bps && BPS_2026[bps] ? `Rs ${n(BPS_2026[bps][0])} – ${n(BPS_2026[bps][1])}` : "";
export const startPay = (bps: number | null) => bps && BPS_2026[bps] ? BPS_2026[bps][0] : null;
