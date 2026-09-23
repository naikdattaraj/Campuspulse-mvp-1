"use client";

import { useEffect, useRef } from "react";

type Props = { open: boolean; unanswered: number; flagged: number; busy: boolean; onCancel: () => void; onConfirm: () => void };

export default function ConfirmSubmitDialog({ open, unanswered, flagged, busy, onCancel, onConfirm }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  // native <dialog>: focus trap, Escape to close and backdrop come for free
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal" aria-labelledby="confirm-title" onCancel={(e) => { e.preventDefault(); onCancel(); }}>
      <h2 id="confirm-title">Submit your test?</h2>
      <p className="muted">You will not be able to change your answers after you submit.</p>
      {(unanswered > 0 || flagged > 0) && (
        <p style={{ marginTop: 12 }} className={unanswered > 0 ? "bad" : undefined}>
          {unanswered > 0 && <>{unanswered} question{unanswered > 1 ? "s" : ""} unanswered. </>}
          {flagged > 0 && <>{flagged} flagged for review.</>}
        </p>
      )}
      <div className="nav-row">
        <button className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn btn-primary" onClick={onConfirm} disabled={busy}>{busy ? "Submitting…" : "Submit"}</button>
      </div>
    </dialog>
  );
}
