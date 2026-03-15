import { useState } from "react";

export interface Competitor {
  id: string;
  name: string;
  company: string;
  website: string;
  description: string;
  targetUser: string;
  keyStrength: string;
}

interface Props {
  competitor: Competitor;
  onRemove?: () => void;
}

export default function CompetitorCard({ competitor, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="competitor-card">
      <div className="competitor-card-header-row">
        <button
          type="button"
          className="competitor-card-header"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <div className="competitor-card-title">
            <div className="competitor-card-name">{competitor.name}</div>
            <div className="competitor-card-company">{competitor.company}</div>
          </div>
          <span className="competitor-card-toggle">{expanded ? "▲" : "▼"}</span>
        </button>
        {onRemove && (
          <button
            type="button"
            className="competitor-card-remove-btn"
            onClick={e => { e.stopPropagation(); onRemove(); }}
            title="Remove competitor"
          >
            ×
          </button>
        )}
      </div>
      {expanded && (
        <div className="competitor-card-body">
          {competitor.description && (
            <p className="competitor-card-desc">{competitor.description}</p>
          )}
          <dl className="competitor-card-meta">
            {competitor.targetUser && (
              <>
                <dt>Target User</dt>
                <dd>{competitor.targetUser}</dd>
              </>
            )}
            {competitor.keyStrength && (
              <>
                <dt>Key Strength</dt>
                <dd>{competitor.keyStrength}</dd>
              </>
            )}
            {competitor.website && (
              <>
                <dt>Website</dt>
                <dd>
                  <a href={competitor.website} target="_blank" rel="noopener noreferrer">
                    {competitor.website}
                  </a>
                </dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
