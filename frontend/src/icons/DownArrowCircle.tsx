import React from 'react';

export default function DownArrowCircle ({ onClick, loading }: { onClick: React.MouseEventHandler<SVGSVGElement>, loading: boolean }) {
    return (
        <svg onClick={onClick} xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-circle-arrow-down rounded-full bg-background-opaque-white stroke-text-dark transition-all hover:stroke-gray-600 duration-300 cursor-pointer rotate-180 ${loading && "stroke-gray-600"}`}>
            <circle cx="12" cy="12" r="10"></circle>
            <path d="m16 12-4-4-4 4"></path>
            <path d="M12 16V8"></path>
        </svg>
    )
}