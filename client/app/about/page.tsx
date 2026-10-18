import Link from "next/link";
import { ArrowUpRight, Database, Eye, ShieldCheck } from "lucide-react";

export default function About() {
  return <main id="main-content">
    <section className="max-w-[920px] py-20 pb-[70px] max-[760px]:py-[52px] max-[760px]:pb-12">
      <p className="mb-5 flex items-center gap-2 text-[10px] font-semibold tracking-[1.6px] text-muted-foreground max-[760px]:text-[8px]"><span className="size-[5px] rounded-full bg-[var(--brand-accent)]" /> WHY HOMEFIELD EXISTS</p>
      <h1 className="mt-[22px] font-serif text-[clamp(48px,5.1vw,73px)] font-normal leading-[1.06] tracking-[-3px] max-[760px]:text-[52px] max-[760px]:tracking-[-2px] [&_em]:font-normal [&_em]:text-ring">Observations.<br /><em>Not predictions.</em></h1>
      <p className="mt-7 max-w-[680px] font-serif text-xl leading-[1.7] text-muted-foreground max-[760px]:text-[17px]">Hazard information should be understandable, traceable, and honest about what it cannot answer—especially for renters deciding where to live.</p>
    </section>
    <section className="border-t border-border [&_article]:grid [&_article]:grid-cols-[52px_1fr] [&_article]:gap-[25px] [&_article]:border-b [&_article]:border-border [&_article]:py-[34px] max-[760px]:[&_article]:grid-cols-[38px_1fr] max-[760px]:[&_article]:gap-3.5 [&_article>svg]:mt-1 [&_article>svg]:size-[27px] [&_article>svg]:text-primary [&_h2]:font-serif [&_h2]:text-[25px] [&_h2]:font-normal [&_h2]:tracking-[-.9px] [&_p:last-child]:mt-3 [&_p:last-child]:max-w-[700px] [&_p:last-child]:text-muted-foreground [&_p:last-child]:leading-[1.9]">
      <article><Eye /><div><p className="mb-2.5 text-[9px] font-semibold tracking-[1.6px] text-muted-foreground">WHAT WE SHOW</p><h2>What satellites observed</h2><p>Each result describes an observation at the selected location. We avoid turning a snapshot into a promise about what happens next.</p></div></article>
      <article><Database /><div><p className="mb-2.5 text-[9px] font-semibold tracking-[1.6px] text-muted-foreground">HOW WE KNOW</p><h2>Sources stay attached</h2><p>Every hazard includes its source, observation dates, spatial resolution, and known limitations.</p></div></article>
      <article><ShieldCheck /><div><p className="mb-2.5 text-[9px] font-semibold tracking-[1.6px] text-muted-foreground">WHEN DATA FALLS SHORT</p><h2>No data is its own answer</h2><p>An unavailable or unreliable reading is never presented as evidence that a home is safe.</p></div></article>
    </section>
    <div className="flex items-center justify-between gap-6 py-11 pb-[70px] max-[760px]:flex-col max-[760px]:items-start max-[760px]:pb-[58px]"><p className="font-serif text-lg italic text-muted-foreground">Ready to look at a King County address?</p><Link className="inline-flex items-center gap-[18px] rounded-md bg-primary px-5 py-[15px] text-xs !text-[var(--primary-foreground)] transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--primary),black_12%)]" href="/search">Open the explorer <ArrowUpRight size={17} /></Link></div>
  </main>;
}
