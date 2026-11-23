'use server';

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Resend } from 'resend';
import { db, dbReady, schema } from '@/lib/db';
import { env } from '@/lib/env';
import { ipHash, rateLimit } from '@/lib/rate-limit';
import { SITE } from '@/content/site';

export type ContactState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

const Contact = z.object({
  name: z.string().trim().min(2, 'Please tell me your name.').max(80),
  email: z.email('That email doesn’t look right.').max(160),
  topic: z.enum(['internship', 'job', 'project', 'general']).default('general'),
  body: z.string().trim().min(10, 'A few more words, please.').max(4000),
});

async function verifyTurnstile(token: string | null, ip: string) {
  if (!env.turnstile) return true;
  if (!token) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token, remoteip: ip }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function sendMessage(_prev: ContactState, form: FormData): Promise<ContactState> {
  // honeypot: real people never fill the hidden "company" field
  if (form.get('company')) return { ok: true, message: 'Thanks, message received.' };

  const parsed = Contact.safeParse({
    name: form.get('name'),
    email: form.get('email'),
    topic: form.get('topic') || 'general',
    body: form.get('body'),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: 'Please check the highlighted fields.', errors };
  }

  const ip = await ipHash();
  if (!(await rateLimit(`contact:${ip}`, 5, 3600))) return { ok: false, message: 'Too many messages from your connection. Please email me directly.' };
  if (!(await verifyTurnstile(form.get('cf-turnstile-response') as string | null, ip))) {
    return { ok: false, message: 'Couldn’t verify you’re human. Please try again.' };
  }

  const m = parsed.data;
  await dbReady;
  await db.insert(schema.message).values({ id: randomUUID(), name: m.name, email: m.email, topic: m.topic, body: m.body, ipHash: ip });

  if (env.resend) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.CONTACT_FROM ?? 'Portfolio <onboarding@resend.dev>';
    const to = process.env.CONTACT_TO ?? SITE.email;
    try {
      await resend.emails.send({
        from,
        to,
        replyTo: m.email,
        subject: `New ${m.topic} message from ${m.name}`,
        html: `<p><strong>${esc(m.name)}</strong> &lt;${esc(m.email)}&gt; · ${esc(m.topic)}</p><p style="white-space:pre-wrap">${esc(m.body)}</p>`,
      });
      if (process.env.CONTACT_AUTOREPLY === '1') {
        await resend.emails.send({
          from,
          to: m.email,
          subject: 'Thanks for getting in touch',
          html: `<p>Hi ${esc(m.name.split(' ')[0])},</p><p>Thanks for your message. I read every one and usually reply within two days.</p><p>Gangul</p>`,
        });
      }
    } catch (e) {
      console.error('[contact] email failed (message saved)', e);
    }
  }
  return { ok: true, message: `Thanks, ${m.name.split(' ')[0]}! Your message is on its way. I usually reply within two days.` };
}
