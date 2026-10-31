import Image from "next/image";
import { Reveal } from "@/components/shared/reveal";
import { COPY } from "@/lib/copy";
import { CAMPUS_VENDOR_TILES, licenseUrl } from "@/lib/partners";

/**
 * F10 vendor wall: photo tiles of the kinds of vendors found on Indian campuses. Names are fictional and the
 * wall is labelled illustrative (no implied partnership); photos are openly licensed and credited below.
 */
export function PartnersWall() {
  const t = COPY.landing.partners;
  return (
    <section aria-labelledby="partners-title" className="bg-page py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-2">{t.eyebrow}</p>
          <h2 id="partners-title" className="mt-3 text-balance text-[clamp(1.75rem,3.6vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-ink">
            {t.title}
          </h2>
        </Reveal>
        <ul className="mt-12 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
          {CAMPUS_VENDOR_TILES.map((v) => (
            <li key={v.slug} className="group relative aspect-[4/5] overflow-hidden rounded-[16px] bg-[#0f0f12]">
              <Image
                src={`/partners/${v.slug}.jpg`}
                alt=""
                fill
                sizes="(min-width: 1280px) 190px, (min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"
                style={{ objectPosition: v.focus }}
              />
              <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_45%,rgba(0,0,0,0.78)_100%)]" />
              <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/90">{t.tag}</span>
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <p className="text-[14px] font-semibold leading-tight">{v.name}</p>
                <p className="pt-0.5 text-[12px] text-white/70">{v.kind}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-5 max-w-2xl text-center text-[12px] text-ink-2">{t.note}</p>
        <details className="mx-auto mt-2 max-w-3xl text-center text-[11.5px] text-ink-2">
          <summary className="inline-flex min-h-11 cursor-pointer items-center underline underline-offset-2">{t.credits}</summary>
          <ul className="mt-1 space-y-1 text-left sm:columns-2 sm:gap-8">
            {CAMPUS_VENDOR_TILES.map((v) => (
              <li key={v.slug} className="break-inside-avoid">
                {v.kind}:{" "}
                <a href={v.photo.source} className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">
                  photo
                </a>{" "}
                by {v.photo.author},{" "}
                <a href={licenseUrl(v.photo.license)} className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">
                  {v.photo.license}
                </a>
                , {t.resized}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}
