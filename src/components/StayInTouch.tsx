import { useState } from 'react';

// Google Apps Script Web App URL (set VITE_SHEET_ENDPOINT in .env.local).
const ENDPOINT = import.meta.env.VITE_SHEET_ENDPOINT;

type Status = 'idle' | 'sending' | 'done' | 'error';

export default function StayInTouch() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = name.trim().length > 0 && emailValid && status !== 'sending';

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('sending');
    try {
      if (ENDPOINT) {
        // Apps Script doesn't return CORS headers — fire-and-forget with no-cors.
        // text/plain avoids a CORS preflight so the request reaches the script.
        await fetch(ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ name: name.trim(), email: email.trim() }),
        });
      } else {
        console.warn('VITE_SHEET_ENDPOINT not set — signup not sent to the sheet.');
      }
      setStatus('done');
    } catch (err) {
      console.error('Stay in Touch submit failed:', err);
      setStatus('error');
    }
  };

  return (
    <div className={`stay-touch${open ? ' open' : ''}`}>
      {open && (
        status === 'done' ? (
          <div className="stay-panel stay-thanks">
            <span className="jumpman-mark stay-jump" aria-hidden="true" />
            Thanks — you're on the list.
          </div>
        ) : (
          <form className="stay-panel stay-form" onSubmit={submit}>
            <div className="stay-heading">Get exhibition updates &amp; drops</div>
            <input
              className="stay-input"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <input
              className="stay-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <button className="stay-submit" type="submit" disabled={!canSubmit}>
              {status === 'sending' ? 'Sending…' : 'Submit'}
            </button>
            {status === 'error' && (
              <div className="stay-error">Something went wrong — please try again.</div>
            )}
          </form>
        )
      )}

      <button
        className="stay-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="jumpman-mark stay-jump" aria-hidden="true" />
        Stay in Touch
        <span className="stay-caret">{open ? '▾' : '▴'}</span>
      </button>
    </div>
  );
}
