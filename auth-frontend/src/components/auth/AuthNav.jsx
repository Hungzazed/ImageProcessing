import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthNav({ active = 'login' }) {
    const linkClass = (name) =>
        `text-sm font-semibold transition-colors ${active === name ? 'text-[#d2bbff]' : 'text-[#ccc3d8] hover:text-[#d2bbff]'
        }`;

    return (
        <div className="flex items-center gap-8">
            <Link className={linkClass('login')} to="/login">
                Sign In
            </Link>
            <Link className={linkClass('register')} to="/register">
                Join Now
            </Link>
            <Link
                className="rounded-full bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                to="/dashboard"
            >
                Get Started
            </Link>
        </div>
    );
}
