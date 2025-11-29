import React, { useEffect, useState, useRef } from 'react';

// A small city-only autocomplete input that uses the Google Places AutocompleteService
// Props:
// - value: current value (string)
// - onChange: function(value) => void when a city is selected or input changes
// Behavior:
// - When user types, we query AutocompleteService with types: ['(cities)']
// - Show a dropdown of suggestions; clicking one selects it and calls onChange
// - Gracefully degrades to a plain input when `window.google` is not available

export default function CityAutocomplete({ value = '', onChange = () => {} }) {
  const [input, setInput] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [open, setOpen] = useState(false);
  const acServiceRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    setInput(value || '');
  }, [value]);

  useEffect(() => {
    // initialize service when google available
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      acServiceRef.current = new window.google.maps.places.AutocompleteService();
    }
  }, []);

  const query = (text) => {
    if (!acServiceRef.current || !text || text.trim().length === 0) {
      setPredictions([]);
      return;
    }

    acServiceRef.current.getPlacePredictions(
      {
        input: text,
        types: ['(cities)'],
      },
      (preds, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !preds) {
          setPredictions([]);
          return;
        }
        setPredictions(preds.slice(0, 6));
      }
    );
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setInput(v);
    onChange(v);
    setOpen(true);

    // debounce
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => query(v), 250);
  };

  const handleSelect = (pred) => {
    const desc = pred.description || pred.structured_formatting?.main_text || '';
    setInput(desc);
    onChange(desc);
    setPredictions([]);
    setOpen(false);
  };

  const handleBlur = () => {
    // small timeout to allow click
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={input}
        onChange={handleChange}
        onFocus={() => { setOpen(true); if (input) query(input); }}
        onBlur={handleBlur}
        placeholder="Enter city"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* suggestions dropdown */}
      {open && predictions.length > 0 && (
        <ul className="absolute left-0 right-0 mt-1 z-50 max-h-56 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {predictions.map((p) => (
            <li
              key={p.place_id}
              onMouseDown={() => handleSelect(p)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {p.description}
            </li>
          ))}
        </ul>
      )}

      {/* fallback note when Google API missing */}
      {!acServiceRef.current && (
        <div className="text-xs text-gray-500 mt-1">Google Places not loaded — please ensure the Maps script is available.</div>
      )}
    </div>
  );
}
