'use client';

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-solid h-11">
      Download PDF / Print
    </button>
  );
}
