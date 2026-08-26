"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CONTACTS,
  CONTACT_LIST,
  NEXT_ECLIPSE,
  TIMELINE_END,
  TIMELINE_START,
  formatDuration,
  formatLocal,
  formatTime,
  percentOfMax,
  remainingContacts,
  stageAt,
  umbralMagnitudeAt,
} from "@/lib/eclipse";
import { defaultGeo, resolveGeo, type GeoState } from "@/lib/geo";

const EclipseCanvas = dynamic(() => import("./EclipseCanvas"), { ssr: false });

type Access = { unlocked: boolean; stripeConfigured: boolean; customerId: string | null };

function stillPreviewTime(now: number): number {
  if (now < CONTACTS.P1) return CONTACTS.P1;
  if (now > CONTACTS.P4) return CONTACTS.GREATEST;
  return now;
}

export default function Tracker() {
  const [access, setAccess] = useState<Access | null>(null);
  const [geo, setGeo] = useState<GeoState>(defaultGeo);
  const [live, setLive] = useState(true);
  const [sim, setSim] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const liveRef = useRef(true);
  liveRef.current = live;

  useEffect(() => {
    fetch("/api/session").then((r) => r.json()).then(setAccess).catch(() => setAccess({ unlocked: false, stripeConfigured: false, customerId: null }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo(resolveGeo(pos.coords.latitude, pos.coords.longitude)),
      () => setGeo(defaultGeo()),
      { maximumAge: 600_000, timeout: 8000 },
    );
  }, []);

  const unlocked = Boolean(access?.unlocked);

  useEffect(() => {
    if (!unlocked || !live) return;
    let id = 0;
    let last = 0;
    const tick = (now: number) => {
      if (liveRef.current && now - last > 90) {
        setSim(Date.now());
        last = now;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [unlocked, live]);

  const viewTime = unlocked ? sim : stillPreviewTime(Date.now());
  const stage = stageAt(viewTime);
  const tz = geo.timeZone;
  const pct = percentOfMax(viewTime);
  const mag = umbralMagnitudeAt(viewTime);
  const remaining = remainingContacts(viewTime);
  const before = viewTime < CONTACTS.P1;
  const after = viewTime > CONTACTS.P4;

  const headline = useMemo(() => {
    if (before) return "T− " + formatDuration(CONTACTS.P1 - viewTime);
    if (after) return "Ended";
    return Math.round(pct) + "% of max";
  }, [before, after, viewTime, pct]);

  const onScrub = useCallback((v: number) => {
    if (!unlocked) return;
    setLive(false);
    setSim(v);
  }, [unlocked]);

  async function subscribe() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/checkout", { method: "POST" });
      const data = await r.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setErr(data.error ?? "Checkout unavailable");
    } catch {
      setErr("Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  async function testUnlock() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/session/unlock", { method: "POST" });
      if (!r.ok) {
        const data = await r.json();
        setErr(data.error ?? "Unlock failed");
        return;
      }
      const session = await fetch("/api/session").then((x) => x.json());
      setAccess(session);
      setLive(true);
      setSim(Date.now());
    } finally {
      setBusy(false);
    }
  }

  async function openPortal() {
    const r = await fetch("/api/portal", { method: "POST" });
    const data = await r.json();
    if (data.url) window.location.href = data.url;
    else setErr(data.error ?? "Portal unavailable");
  }

  return (
    <main className="app">
      <div className={"canvas-wrap" + (unlocked ? "" : " locked")}>
        <EclipseCanvas time={viewTime} live={unlocked && live} reduced={!unlocked} />
      </div>
      <div className="hud">
        <header className="top">
          <div className="wordmark">
            Partial lunar eclipse
            <strong>27–28 August 2026</strong>
          </div>
          <div className="meta">
            <b>{formatTime(unlocked ? sim : Date.now(), tz)}</b>
            {geo.label}
          </div>
        </header>

        <section className="mid">
          <h1 className="stage-name">{stage.name}</h1>
          <p className="stage-blurb">{stage.blurb}</p>
          <div className="stats">
            <div className="stat">
              <dt>{before ? "Countdown" : after ? "Status" : "Of greatest"}</dt>
              <dd>{headline}</dd>
            </div>
            <div className="stat">
              <dt>Umbral mag.</dt>
              <dd>{mag.toFixed(3)}</dd>
            </div>
          </div>
          {after ? (
            <p className="stage-blurb" style={{ marginTop: 12 }}>
              Next: {NEXT_ECLIPSE.name} on {NEXT_ECLIPSE.dateLabel}.
            </p>
          ) : (
            <ul className="contacts">
              {remaining.map((c) => (
                <li key={c.key}>
                  <span>{c.label}</span>
                  <b>{formatLocal(c.at, tz)}</b>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="bottom">
          {unlocked ? (
            <div className="timeline">
              <div className="timeline-head">
                <span>Stage timeline</span>
                <button className="live-btn" data-on={live ? "true" : "false"} onClick={() => { setLive(true); setSim(Date.now()); }}>
                  {live ? "Live" : "Snap to now"}
                </button>
              </div>
              <input
                type="range"
                min={TIMELINE_START}
                max={TIMELINE_END}
                value={Math.min(TIMELINE_END, Math.max(TIMELINE_START, viewTime))}
                onChange={(e) => onScrub(Number(e.target.value))}
              />
              <div className="ticks">
                <span>P1</span><span>U1</span><span>Greatest</span><span>U4</span><span>P4</span>
              </div>
              {access?.customerId ? (
                <button className="ghost-btn" style={{ marginTop: 8 }} onClick={openPortal}>Cancel anytime — Stripe portal</button>
              ) : access?.stripeConfigured === false ? (
                <p className="locked-note" style={{ marginTop: 8 }}>TEST session — not a paid subscription.</p>
              ) : null}
            </div>
          ) : (
            <>
              <ul className="stages-free">
                {CONTACT_LIST.map((c) => (
                  <li key={c.key}>
                    <b>{c.label}</b>
                    <span>{formatLocal(CONTACTS[c.key], tz)}</span>
                  </li>
                ))}
              </ul>
              <div className="pay-bar">
                {!access?.stripeConfigured ? <span className="test-tag">TEST — no Stripe keys</span> : null}
                <p>
                  Free preview is a still of the current or next stage. Live tracking, full animation, countdown, and scrubbing are <strong>$2.99 / week</strong>. Cancel anytime.
                </p>
                {access?.stripeConfigured ? (
                  <button className="pay-btn" disabled={busy} onClick={subscribe}>
                    {busy ? "Opening checkout…" : "Subscribe · $2.99 / week"}
                  </button>
                ) : (
                  <button className="pay-btn" disabled={busy} onClick={testUnlock}>
                    {busy ? "Unlocking…" : "TEST unlock live tracker (no charge)"}
                  </button>
                )}
                {err ? <p className="locked-note">{err}</p> : null}
              </div>
            </>
          )}
        </footer>
      </div>
    </main>
  );
}
