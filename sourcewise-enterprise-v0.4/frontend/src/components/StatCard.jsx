export default function StatCard({ label, value, note, tone = 'neutral', icon }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-icon" aria-hidden="true">{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <strong className="stat-value">{value}</strong>
        {note && <p className="stat-note">{note}</p>}
      </div>
    </article>
  )
}
