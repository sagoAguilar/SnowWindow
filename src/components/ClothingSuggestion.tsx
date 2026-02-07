import type { ClothingSuggestion as ClothingSuggestionType } from '../types';

interface ClothingSuggestionProps {
  suggestion: ClothingSuggestionType;
  forShoveling?: boolean;
}

export function ClothingSuggestion({ suggestion, forShoveling = false }: ClothingSuggestionProps) {
  const { summary, feelsLike, items, warnings } = suggestion;

  return (
    <div className={`clothing-suggestion card${forShoveling ? ' clothing-shoveling' : ''}`}>
      <div className="clothing-header">
        <span className="clothing-header-icon">{forShoveling ? '🚿' : '🧥'}</span>
        <div>
          <h3>{forShoveling ? 'What to Wear for Shoveling' : 'What to Wear Outside'}</h3>
          <p className="clothing-summary">{summary}</p>
        </div>
      </div>

      <div className="clothing-feels-like">
        <span className="feels-like-label">Feels like</span>
        <span className="feels-like-value">{feelsLike}°C</span>
      </div>

      {items.length > 0 && (
        <ul className="clothing-items">
          {items.map((item, i) => (
            <li key={i} className="clothing-item">
              <span className="clothing-item-icon">{item.icon}</span>
              <span className="clothing-item-label">{item.label}</span>
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <div className="clothing-warnings">
          {warnings.map((warning, i) => (
            <div key={i} className="clothing-warning">
              <span className="clothing-warning-icon">⚠️</span>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
