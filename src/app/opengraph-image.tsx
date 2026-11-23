import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE } from '@/content/site';

export const alt = `${SITE.name} | ${SITE.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  const photo = await readFile(join(process.cwd(), 'src/assets/me/portrait.jpg'));
  const src = `data:image/jpeg;base64,${photo.toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#0c0a08', color: '#ede6da', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', background: 'radial-gradient(60% 80% at 75% 60%, rgba(240,138,60,0.35), transparent 70%)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px', width: '62%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: '#958b7d' }}>
            <div style={{ width: 12, height: 12, borderRadius: 12, background: '#5ee37a' }} /> {SITE.availability}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 124, fontWeight: 600, letterSpacing: -6, lineHeight: 0.9 }}>Gangul</div>
            <div style={{ fontSize: 124, fontWeight: 600, letterSpacing: -6, lineHeight: 0.95, color: '#f08a3c' }}>Missaka</div>
            <div style={{ fontSize: 30, marginTop: 28, color: '#d9d0c1' }}>{`${SITE.roleLong} · ${SITE.location}`}</div>
          </div>
        </div>
        <div style={{ display: 'flex', width: '38%', padding: '40px 48px 40px 0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" width={408} height={550} style={{ objectFit: 'cover', borderRadius: 24, width: '100%', height: '100%' }} />
        </div>
      </div>
    ),
    size,
  );
}
