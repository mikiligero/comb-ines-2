import type { ReactNode } from "react";

type TopbarProps = {
  title: string;
  crumb?: string;
  right?: ReactNode;
};

export default function Topbar({ title, crumb, right }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="crumb">
        {crumb && (
          <>
            <span>{crumb}</span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </>
        )}
        <b>{title}</b>
      </div>
      {right && <div className="right">{right}</div>}
    </div>
  );
}
