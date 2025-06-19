import React from "react";

export default function ActionSection({ title, description, children }) {
    return (
        <section className="mb-8 p-6 bg-white rounded shadow">
            {title && <h2 className="text-xl font-bold mb-2">{title}</h2>}
            {description && <p className="text-gray-600 mb-4">{description}</p>}
            <div>{children}</div>
        </section>
    );
}