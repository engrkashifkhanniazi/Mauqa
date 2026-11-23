const LINKS: [string, string, string][] = [["/about", "About", "ہمارے بارے میں"], ["/contact", "Contact", "رابطہ"], ["/privacy", "Privacy", "پرائیویسی"], ["/terms", "Terms", "شرائط"], ["/disclaimer", "Disclaimer", "اعلانِ لاتعلقی"]];
export default function FootLinks() {
  return (<nav className="fl" aria-label="Site">{LINKS.map(([h, en, ur]) => <a key={h} href={h}><span className="t-en">{en}</span><span className="t-ur" lang="ur">{ur}</span></a>)}
    <span className="fl-c">© {new Date().getFullYear()} Mauqa</span></nav>);
}
