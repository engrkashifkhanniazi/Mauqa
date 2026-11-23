import FootLinks from "@/components/FootLinks";
/** Shared frame for the information pages (About, Contact, Privacy, Terms, Disclaimer). English text; Urdu summary on top where useful. */
export default function Doc({ title, ur, updated, children }: { title: string; ur?: string; updated?: string; children: React.ReactNode }) {
  return (<div className="jp">
    <header className="jp-top"><div className="u-wrap jp-nav"><a href="/" className="jp-logo">Mauqa</a><a href="/" className="jp-back">← All jobs</a></div></header>
    <main className="u-wrap jp-main doc" lang="en" dir="ltr"><article className="jp-card">
      <h1>{title}</h1>{updated && <p className="jp-note">Last updated: {updated}</p>}
      {ur && <p className="doc-ur" lang="ur" dir="rtl">{ur}</p>}
      {children}</article></main>
    <footer className="u-foot"><div className="u-wrap"><FootLinks /></div></footer></div>);
}
