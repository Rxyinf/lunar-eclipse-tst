import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="app" style={{ display: "grid", placeItems: "center", padding: 24 }}>
      <div>
        <p className="wordmark">Checkout canceled</p>
        <h1 className="stage-name">No charge was made.</h1>
        <p className="stage-blurb">You can return to the tracker anytime. Live tracking is $2.99 / week.</p>
        <Link href="/" className="ghost-btn" style={{ display: "inline-block", textDecoration: "none" }}>
          Back to tracker
        </Link>
      </div>
    </main>
  );
}
