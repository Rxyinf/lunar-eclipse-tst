"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONTACTS,
  TIMELINE_END,
  TIMELINE_START,
  formatTime,
  stageAt,
} from "@/lib/eclipse";
import { defaultGeo, resolveGeo, type GeoState } from "@/lib/geo";

const EclipseCanvas = dynamic(() => import("./EclipseCanvas"), { ssr: false });

const SPAN = TIMELINE_END - TIMELINE_START;
const PLAY_RATE = 14 * 60 * 1000;

export default function Tracker() {
  const [geo, setGeo] = useState<GeoState>(defaultGeo);
  const [sim, setSim] = useState(CONTACTS.U1);
  const [playing, setPlaying] = useState(true);
  const [hint, setHint] = useState(true);
  const playRef = useRef(true);
  const simRef = useRef(sim);
  playRef.current = playing;
  simRef.current = sim;

  const drag = useRef<{ y: number; t: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo(resolveGeo(pos.coords.latitude, pos.coords.longitude)),
      () => setGeo(defaultGeo()),
      { maximumAge: 600_000, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setHint(false), 5000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    let id = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (playRef.current) {
        let next = simRef.current + dt * PLAY_RATE;
        if (next > TIMELINE_END) next = TIMELINE_START;
        simRef.current = next;
        setSim(next);
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const onDown = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, t: simRef.current };
    setPlaying(false);
    setHint(false);
  }, []);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return;
    const dy = drag.current.y - e.clientY;
    const next = Math.min(
      TIMELINE_END,
      Math.max(TIMELINE_START, drag.current.t + (dy / window.innerHeight) * SPAN),
    );
    simRef.current = next;
    setSim(next);
  }, []);

  const onUp = useCallback(() => {
    drag.current = null;
  }, []);

  const stage = stageAt(sim);
  const tz = geo.timeZone;

  return (
    <main className="app">
      <div
        className="canvas-wrap"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <EclipseCanvas time={sim} />
      </div>
      <div className="chrome">
        <p className="time">{formatTime(sim, tz)}</p>
        <p className="stage">{stage.name}</p>
      </div>
      {hint ? <p className="hint">Swipe for time</p> : null}
    </main>
  );
}
