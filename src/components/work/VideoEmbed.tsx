'use client';

import Image from 'next/image';
import { useState } from 'react';
import poster from '@/assets/work/apparition.jpg';

/** Click-to-load YouTube (privacy-enhanced domain): no third-party script or cookies until the visitor presses play. */
export function VideoEmbed({ id, title }: { id: string; title: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-[1.4rem] border border-line bg-ink-2">
      {play ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0" data-cursor="Play" aria-label={`Play ${title}`}>
          <Image src={poster} alt="" fill sizes="100vw" placeholder="blur" className="object-cover opacity-70 transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.03]" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-24 place-items-center rounded-full bg-bone text-2xl text-ink transition-transform duration-500 group-hover:scale-110">▶</span>
          </span>
          <span className="absolute bottom-6 left-6 eyebrow !text-bone">Watch the trailer · YouTube</span>
        </button>
      )}
    </div>
  );
}
