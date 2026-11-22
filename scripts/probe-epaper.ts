import { politeFetch } from "../src/lib/fetcher";
(async () => {
  for (const url of process.argv.slice(2)) {
    try {
      const r = await politeFetch(url);
      const html = r.text ?? Buffer.from(r.body ?? []).toString("utf8");
      console.log(`URL ${url} http=${r.status} len=${html.length}`);
      const imgs = [...html.matchAll(/<img[^>]+>/gi)].map((m) => m[0]).filter((t) => /e-?paper|epaper|upload|page|edition/i.test(t));
      console.log("IMGS", imgs.slice(0, 12).join("\n"));
      const all=[...html.matchAll(/https?:[^"'\s)<>]+\.(?:jpe?g|png|webp|pdf)/gi)].map((m)=>m[0]).filter((u)=>!/220x165|theme|Logo|logo|-\d+x\d+\./.test(u));console.log("ALLIMG",[...new Set(all)].slice(0,25).join("\n"));const ix=html.search(/pageno|e-?paper-?img|epaper_page/i);console.log("CTX",html.slice(Math.max(0,html.search(/class=["'][^"']*(epaper|paper)[^"']*["']/i)),Math.max(0,html.search(/class=["'][^"']*(epaper|paper)[^"']*["']/i))+1500));console.log("LINKS", [...html.matchAll(/(?:href|src|data-src)=["']([^"']+\.(?:jpe?g|png|webp|pdf)[^"']*)["']/gi)].map((m) => m[1]).filter((u) => /paper|epaper|page/i.test(u)).slice(0, 15).join("\n"));
    } catch (e) { console.log("ERR", url, (e as Error).message); }
  }
})();
