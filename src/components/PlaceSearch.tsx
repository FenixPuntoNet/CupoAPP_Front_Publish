import React from 'react';
import { TextInput } from '@mantine/core';
import { MapPin } from 'lucide-react';
import type { PlaceSuggestion } from '@/services/googleMaps';

interface PlaceSearchProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  suggestions: PlaceSuggestion[];
  onSuggestionClick: (suggestion: PlaceSuggestion) => void;
  showSuggestions: boolean;
  className?: string;
  inputIcon?: React.ReactNode;
  styles?: any;
}

export const PlaceSearchInput: React.FC<PlaceSearchProps> = ({
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  suggestions,
  onSuggestionClick,
  showSuggestions,
  className,
  inputIcon,
  styles
}) => {
  return (
    <div className={styles?.inputWrapper}>
      <div className={styles?.inputContainer}>
        <div className={styles?.inputIcon}>
          {inputIcon || <MapPin size={20} />}
        </div>
        <TextInput
          className={className}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          variant="unstyled"
          required
          size="md"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className={styles?.suggestionsContainer}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              className={styles?.suggestionItem}
              onClick={() => onSuggestionClick(suggestion)}
              type="button"
            >
              <MapPin size={16} className={styles?.suggestionIcon} />
              <div>
                <div className={styles?.suggestionMain}>
                  {suggestion.mainText}
                </div>
                <div className={styles?.suggestionSecondary}>
                  {suggestion.secondaryText}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
