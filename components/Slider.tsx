
import React from 'react';

interface SliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  defaultValue: number;
}

export const Slider: React.FC<SliderProps> = ({ id, label, min, max, step, value, onChange, onReset, defaultValue }) => {
  const isDefault = value === defaultValue;
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-300">{label}</label>
        <div className="flex items-center space-x-2">
            <span className="text-xs font-mono bg-gray-700 text-white px-2 py-0.5 rounded">{value}</span>
            {!isDefault && (
                 <button onClick={onReset} className="text-xs text-blue-400 hover:text-blue-300 transition">&times; reset</button>
            )}
        </div>
      </div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-blue-500"
      />
    </div>
  );
};
