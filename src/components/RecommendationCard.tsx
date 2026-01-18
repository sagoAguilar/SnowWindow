import type { ShovelingRecommendation, UrgencyLevel } from '../types';

interface RecommendationCardProps {
  recommendation: ShovelingRecommendation;
}

const urgencyColors: Record<UrgencyLevel, string> = {
  none: 'var(--color-success)',
  low: 'var(--color-info)',
  moderate: 'var(--color-warning)',
  high: 'var(--color-danger)',
  urgent: 'var(--color-danger)'
};

const urgencyLabels: Record<UrgencyLevel, string> = {
  none: 'All Clear',
  low: 'Low Priority',
  moderate: 'Moderate',
  high: 'High Priority',
  urgent: 'Urgent!'
};

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const {
    shouldShovel,
    urgency,
    optimalTime,
    message,
    reasoning,
    estimatedMinutes,
    salt,
    totalAccumulation
  } = recommendation;

  const urgencyStyle = { '--urgency-color': urgencyColors[urgency] } as React.CSSProperties;

  return (
    <div className={`recommendation-card urgency-${urgency}`} style={urgencyStyle}>
      <div className="recommendation-header">
        <span className="recommendation-icon">
          {shouldShovel ? '🚿' : '✅'}
        </span>
        <div className="recommendation-title">
          <h2>{message}</h2>
          <span className="urgency-badge">{urgencyLabels[urgency]}</span>
        </div>
      </div>

      {shouldShovel && optimalTime && (
        <div className="optimal-time">
          <div className="time-display">
            <span className="time-icon">⏰</span>
            <span className="time-value">
              {optimalTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </span>
          </div>
          <span className="time-label">Optimal shoveling time</span>
        </div>
      )}

      <div className="recommendation-stats">
        {totalAccumulation > 0 && (
          <div className="stat">
            <span className="stat-icon">❄️</span>
            <span className="stat-value">{totalAccumulation.toFixed(0)}mm</span>
            <span className="stat-label">Expected</span>
          </div>
        )}

        {estimatedMinutes && (
          <div className="stat">
            <span className="stat-icon">💪</span>
            <span className="stat-value">~{estimatedMinutes} min</span>
            <span className="stat-label">To clear</span>
          </div>
        )}
      </div>

      <div className="reasoning">
        <h3>Why?</h3>
        <ul>
          {reasoning.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      </div>

      {salt.shouldApply && (
        <div className="salt-advice">
          <span className="salt-icon">🧂</span>
          <div className="salt-content">
            <strong>Salt Recommendation</strong>
            <p>{salt.reason}</p>
            {salt.amount && salt.timingMessage && (
              <p className="salt-details">
                Use <strong>{salt.amount}</strong> • {salt.timingMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
