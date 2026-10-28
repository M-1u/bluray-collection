const ITEMS = [
  ['owned', 'Possédé', 'owned'],
  ['custom', 'Custom', 'custom'],
  ['wishlist', 'À acheter', 'wishlist'],
];
const TOOLS = [
  ['stats', 'Stats'],
  ['import', 'Import Letterboxd'],
  ['settings', 'Réglages'],
];

export default function Sidebar({ view, setView, counts }) {
  return (
    <nav className="sidebar">
      <div className="brand">Blu-ray <span>Collection</span></div>
      {ITEMS.map(([id, label, countKey]) => (
        <button key={id} className={`nav-btn ${view === id ? 'active' : ''}`} onClick={() => setView(id)}>
          {label}
          <span className="count">{counts?.[countKey] ?? ''}</span>
        </button>
      ))}
      <div className="nav-sep" />
      {TOOLS.map(([id, label]) => (
        <button key={id} className={`nav-btn ${view === id ? 'active' : ''}`} onClick={() => setView(id)}>
          {label}
        </button>
      ))}
    </nav>
  );
}
