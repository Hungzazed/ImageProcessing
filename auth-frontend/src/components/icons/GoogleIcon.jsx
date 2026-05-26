import React from 'react';

export default function GoogleIcon({ className = '', ...props }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 48 48"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path d="M44.5 20H24v8.5h11.8C34.7 33.8 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 3l6.1-6.1C34.6 4 29.7 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22 22-9.8 22-22c0-1.3-.1-2.1-.5-4z" fill="#4285F4" />
            <path d="M6.3 14.7 13.4 20C15.3 15.9 19.3 13 24 13c3.1 0 5.9 1.1 8.1 3l6.1-6.1C34.6 4 29.7 2 24 2 16 2 9 6.5 6.3 14.7z" fill="#EA4335" />
            <path d="M24 46c5.8 0 10.7-1.9 14.3-5.2l-6.6-5.5C29.8 37.1 27.1 38 24 38c-6.1 0-11.3-3.8-13.2-9.2l-7.1 5.5C6.4 41.4 14.5 46 24 46z" fill="#34A853" />
            <path d="M44.5 20H24v8.5h11.8c-1 3.6-3.1 6.2-6.1 7.8l6.6 5.5C40.4 37.3 46 31.5 46 24c0-1.3-.1-2.1-.5-4z" fill="#FBBC05" />
        </svg>
    );
}