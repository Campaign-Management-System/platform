import React, { useState } from 'react';

export default function StudentIdentifierInput({
  onSubmit,
  placeholder = "הקלד תעודת זהות...",
  label = "הקלדה ידנית"
}) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    onSubmit(trimmed);
    setValue('');
  };

  return (
    <div className="space-y-3">
      <div className="text-center text-gray-400">או</div>

      <div className="bg-white p-6 rounded-2xl shadow border">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          className="w-full border rounded-lg p-3 text-center"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
        />
      </div>
    </div>
  );
}
