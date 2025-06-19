import React, { useState } from "react";
import axios from "axios";

export default function ConfirmsPassword({ onConfirmed, children }) {
    const [show, setShow] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleConfirm = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await axios.post("/user/confirm-password", { password });
            setShow(false);
            setPassword("");
            setError("");
            setLoading(false);
            onConfirmed && onConfirmed();
        } catch (err) {
            setLoading(false);
            setError("Password is incorrect.");
        }
    };

    return (
        <>
            <span onClick={() => setShow(true)} style={{ display: "inline-block" }}>
                {children}
            </span>
            {show && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <form
                        onSubmit={handleConfirm}
                        className="bg-white p-6 rounded shadow-md min-w-[300px]"
                    >
                        <h2 className="text-lg font-semibold mb-4">Confirm Password</h2>
                        <input
                            type="password"
                            className="border rounded w-full p-2 mb-2"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                className="px-3 py-1 bg-gray-200 rounded"
                                onClick={() => {
                                    setShow(false);
                                    setPassword("");
                                    setError("");
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1 bg-blue-600 text-white rounded"
                                disabled={loading}
                            >
                                {loading ? "Confirming..." : "Confirm"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}