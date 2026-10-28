import { FORMATS, FORMAT_LABELS, STATES, STATE_LABELS, CUSTOM_STATUSES, CUSTOM_STATUS_LABELS } from '../lib/model.js';

// Champs d'une édition (format, état, statut custom, note). Contrôlé par `value`.
export default function EditionForm({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="row">
      <select value={value.state} onChange={(e) => {
        const st = e.target.value;
        set({ state: st, customStatus: st === 'custom' ? value.customStatus || 'a_creer' : null,
          format: st === 'custom' ? 'Custom' : value.format });
      }}>
        {STATES.map((s) => <option key={s} value={s}>{STATE_LABELS[s]}</option>)}
      </select>
      <select value={value.format} onChange={(e) => set({ format: e.target.value })}>
        {FORMATS.map((f) => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
      </select>
      {value.state === 'custom' && (
        <select value={value.customStatus || 'a_creer'} onChange={(e) => set({ customStatus: e.target.value })}>
          {CUSTOM_STATUSES.map((s) => <option key={s} value={s}>{CUSTOM_STATUS_LABELS[s]}</option>)}
        </select>
      )}
      <input type="text" placeholder="Note (éditeur, magasin, prix…)" value={value.note || ''}
        onChange={(e) => set({ note: e.target.value })} style={{ flex: 1, minWidth: 160 }} />
    </div>
  );
}
