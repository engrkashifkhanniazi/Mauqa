import { writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { politeFetch } from "../src/lib/fetcher";
(async () => {
  const url = process.argv[2];
  const r = await politeFetch(url);
  console.log(`http=${r.status} bytes=${r.body?.length} type=${r.contentType}`);
  writeFileSync("snap.html", r.body!);
  console.log("---B64START---\n" + gzipSync(r.body!, { level: 9 }).toString("base64") + "\n---B64END---");
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
