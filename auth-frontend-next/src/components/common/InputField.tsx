'use client';

import React from 'react';

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  className?: string;
};

export default function InputField({ label, error, className = '', ...props }: InputFieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-[#ccc3d8]">{label}</span>
      <input
        {...props}
        className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#dae2fd] placeholder:text-[#ccc3d8]/60 outline-none transition focus:border-[#d2bbff] focus:shadow-[0_0_15px_rgba(210,187,255,0.2)] ${props.disabled ? 'opacity-60' : ''}`}
      />
      {error ? <span className="mt-2 block text-sm text-red-300">{error}</span> : null}
    </label>
  );
}
