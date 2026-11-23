'use client';

import Script from 'next/script';
import { useActionState, useState } from 'react';
import { sendMessage, type ContactState } from '@/lib/actions/contact';

const TOPICS = [
  { id: 'internship', label: 'Internship' },
  { id: 'job', label: 'Graduate role' },
  { id: 'project', label: 'A project' },
  { id: 'general', label: 'Just saying hi' },
];

export function ContactForm({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, null);
  const [topic, setTopic] = useState('internship');
  const err = state?.errors ?? {};

  if (state?.ok) {
    return (
      <div className="rounded-[1.4rem] border border-line bg-ink-2 p-10" role="status">
        <p className="text-5xl" aria-hidden>✦</p>
        <p className="h-md mt-6">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-10" noValidate>
      <fieldset>
        <legend className="eyebrow mb-4">I’m reaching out about</legend>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <label key={t.id} className={`chip h-10 cursor-pointer px-4 transition-colors ${topic === t.id ? 'border-bone bg-bone text-ink' : 'hover:border-bone'}`}>
              <input type="radio" name="topic" value={t.id} checked={topic === t.id} onChange={() => setTopic(t.id)} className="sr-only" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-10 md:grid-cols-2">
        <Field label="Your name" name="name" autoComplete="name" error={err.name} />
        <Field label="Email" name="email" type="email" autoComplete="email" error={err.email} />
      </div>
      <Field label="Message" name="body" textarea error={err.body} placeholder="Tell me about the role, the project or the idea…" />

      {/* honeypot */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Company <input name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {turnstileSiteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="dark" />
        </>
      )}

      <div className="flex flex-wrap items-center gap-6">
        <button type="submit" disabled={pending} className="btn btn-solid h-14 px-8 text-base" data-cursor="Send">
          {pending ? 'Sending…' : 'Send message'} <span aria-hidden>→</span>
        </button>
        {state && !state.ok && <p role="alert" className="text-sm text-red-400">{state.message}</p>}
      </div>
    </form>
  );
}

function Field({ label, name, type = 'text', textarea, error, autoComplete, placeholder }: { label: string; name: string; type?: string; textarea?: boolean; error?: string; autoComplete?: string; placeholder?: string }) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="eyebrow">{label}</label>
      {textarea ? (
        <textarea id={id} name={name} required rows={5} className="field" placeholder={placeholder} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} />
      ) : (
        <input id={id} name={name} type={type} required autoComplete={autoComplete} className="field" placeholder={placeholder} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} />
      )}
      {error && <p id={`${id}-e`} className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
