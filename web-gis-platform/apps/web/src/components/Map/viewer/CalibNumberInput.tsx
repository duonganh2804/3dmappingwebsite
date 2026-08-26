import { useEffect, useState } from 'react';

export function CalibNumberInput({
  value,
  onChange,
  step = 'any',
  className = '',
}: {
  value: number;
  onChange: (value: number) => void;
  step?: string;
  className?: string;
}) {
  const [text, setText] = useState(value.toString());

  useEffect(() => {
    setText(value.toString());
  }, [value]);

  return (
    <input
      type="number"
      step={step}
      value={text}
      onChange={(event) => {
        const nextText = event.target.value;
        setText(nextText);
        const parsed = Number.parseFloat(nextText);
        if (Number.isFinite(parsed)) onChange(parsed);
      }}
      className={className}
    />
  );
}
