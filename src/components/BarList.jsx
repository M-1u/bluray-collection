// Liste de barres horizontales : [{ label, count }].
export default function BarList({ rows, empty = 'Aucune donnée.' }) {
  if (!rows.length) return <span className="muted small-text">{empty}</span>;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div>
      {rows.map((r) => (
        <div key={r.label} className="bar-row">
          <span className="label" title={r.label}>{r.label}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(r.count / max) * 100}%` }} /></div>
          <span className="n">{r.count}</span>
        </div>
      ))}
    </div>
  );
}
