import { Activity } from "lucide-react";

export default function Logo({ tag }: { tag?: string }) {
  return (
    <span className="logo">
      <span className="logo-mark" aria-hidden="true"><Activity size={18} /></span>
      AI CampusPulse
      {tag && <small>{tag}</small>}
    </span>
  );
}
