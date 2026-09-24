import type { TargetSummary } from '../features/preview';

/** Live preview of what "Copy properties" would copy; hidden while the canvas is empty. */
export function PropertiesCard({ summary }: { summary: TargetSummary }) {
  if (summary.rows.length === 0 && !summary.error) return null;

  return (
    <div className="props-card" data-testid="props-card">
      <div className="props-card-title">{summary.scope === 'selection' ? 'Selection' : 'Whole canvas'}</div>
      {summary.error ? (
        <div className="props-card-error">{summary.error}</div>
      ) : (
        <dl>
          {summary.rows.map(([label, value]) => (
            <div key={label} className="props-card-row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
