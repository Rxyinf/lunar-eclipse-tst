"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Confirm() {
  const params = useSearchParams();
  const [msg, setMsg] = useState("Confirming subscription…");

  useEffect(() => {
    const id = params.get("session_id");
    if (!id) {
      setMsg("Missing checkout session.");
      return;
    }
    fetch("/api/session/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: id }),
    })
      .then(async (r) => {
        if (r.ok) {
          window.location.href = "/";
        } else {
          setMsg("Could not confirm payment. No charge is faked.");
        }
      })
      .catch(() => setMsg("Network error confirming checkout."));
  }, [params]);

  return <p className="flash">{msg}</p>;
}

export default function SuccessPage() {
  return (
    <main className="app">
      <Suspense fallback={<p className="flash">Loading…</p>}>
        <Confirm />
      </Suspense>
    </main>
  );
}
