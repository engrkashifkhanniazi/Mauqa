export interface ParsedFile { label: string; url: string; kind: "advertisement" | "corrigendum" | "syllabus" | "apply" }
export interface ParsedJob { sourceKey: "ETEA" | "KPPSC" | "FPSC"; externalId: string; title: string; department?: string; bps?: number | null; lastDate: string | null; officialUrl: string; applyUrl?: string; files: ParsedFile[]; needsAi: boolean; fieldsConfirmedAgainstSource: boolean }
export interface ParseResult { items: ParsedJob[]; emptyState: boolean; broken: boolean; note?: string }
