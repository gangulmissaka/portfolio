import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[80svh] flex-col justify-center pt-[var(--header-h)]">
      <p className="eyebrow mb-6">Error 404</p>
      <h1 className="display text-[clamp(4rem,16vw,15rem)]">
        Lost <span className="serif-i text-ember">signal</span>
      </h1>
      <p className="lead mt-8 max-w-[40ch]">This page doesn’t exist, or it moved when I rebuilt the site. Let’s get you somewhere useful.</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-solid">Back home</Link>
        <Link href="/work" className="btn btn-ghost">See my work</Link>
      </div>
    </section>
  );
}
