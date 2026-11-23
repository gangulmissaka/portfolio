/**
 * Letters roll up one after another on hover (the parent link/button triggers it via `.roll-host`).
 * Each letter carries a copy of itself as a text-shadow below, so there's no duplicate DOM.
 */
export function RollText({ children, className }: { children: string; className?: string }) {
  return (
    <span className={`roll ${className ?? ''}`}>
      <span className="sr-only">{children}</span>
      <span aria-hidden className="roll__chars">
        {children.split('').map((c, i) => (
          <span key={i} className="roll__c" style={{ ['--i' as string]: i }}>
            {c === ' ' ? ' ' : c}
          </span>
        ))}
      </span>
    </span>
  );
}
