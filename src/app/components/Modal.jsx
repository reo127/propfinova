"use client";

export default function Modal({ isOpen, onClose, children }) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center "
            onClick={onClose}
        >
            <div
                className="relative bg-surface p-4 rounded-lg max-w-4xl max-h-full"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {children}
            </div>
        </div>
    );
}
