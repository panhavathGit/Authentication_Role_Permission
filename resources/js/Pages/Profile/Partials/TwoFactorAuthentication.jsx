import { useState, useEffect } from "react";
import { useForm, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import ConfirmsPassword from "@/Components/ConfirmsPassword"; // This is the component that creates the current modal

const TwoFactorAuthenticationForm = ({ className = "" }) => {
    const { auth } = usePage().props;
    const [enabling, setEnabling] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [disabling, setDisabling] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [setupKey, setSetupKey] = useState(null);
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [fetchError, setFetchError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null); // New state for success messages

    const confirmationForm = useForm({
        code: "",
    });

    const enableForm = useForm({});
    const disableForm = useForm({});
    const regenerateForm = useForm({});

    const twoFactorEnabled = !!(
        auth.user?.two_factor_enabled ||
        auth.user?.two_factor_secret ||
        auth.user?.has_two_factor_secret
    );

    const needsConfirmation =
        twoFactorEnabled && !auth.user?.two_factor_confirmed_at;

    useEffect(() => {
        if (!twoFactorEnabled) {
            setQrCode(null);
            setSetupKey(null);
            setRecoveryCodes([]);
            setConfirming(false);
            setSuccessMessage(null); // Clear success message if 2FA disabled
        } else {
            fetchQrCodeAndSetupKey();
            if (!needsConfirmation) {
                fetchRecoveryCodes();
            }
        }
    }, [twoFactorEnabled, needsConfirmation]);

    // Clear messages after a short period
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 3000); // Clear after 3 seconds
            return () => clearTimeout(timer);
        }
        if (fetchError) {
            const timer = setTimeout(() => {
                setFetchError(null);
            }, 5000); // Clear error after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [successMessage, fetchError]);

    const getHeaders = () => {
        const token = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");
        return {
            "X-CSRF-TOKEN": token,
            "X-Requested-With": "XMLHttpRequest",
        };
    };

    const cleanSvgString = (svgString) => {
        let cleaned = svgString;

        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1);
        }

        cleaned = cleaned.replace(/\\"/g, '"');
        cleaned = cleaned.replace(/\\\\/g, "\\");
        cleaned = cleaned.replace(/<text[^>]*>.*?<\/text>/gi, "");
        cleaned = cleaned.replace(/<tspan[^>]*>.*?<\/tspan>/gi, "");

        return cleaned;
    };

    const fetchQrCodeAndSetupKey = async () => {
        if (loading) return;

        setLoading(true);
        setFetchError(null);
        setSuccessMessage(null); // Clear previous messages

        try {
            // Fetch QR code
            const qrResponse = await fetch(route("two-factor.qr-code"), {
                method: "GET",
                headers: getHeaders(),
                credentials: "same-origin",
            });

            if (qrResponse.ok) {
                const qrCodeSvg = await qrResponse.text();
                const cleanedSvg = cleanSvgString(qrCodeSvg);
                setQrCode(cleanedSvg);
            } else if (qrResponse.status === 423) {
                setFetchError(
                    "Please confirm your password to view the QR code and secret key."
                );
            } else {
                throw new Error(`HTTP ${qrResponse.status}`);
            }

            // Fetch setup key
            const keyResponse = await fetch(route("two-factor.secret-key"), {
                method: "GET",
                headers: getHeaders(),
                credentials: "same-origin",
            });

            if (keyResponse.ok) {
                const keyData = await keyResponse.json();
                let secretKey =
                    keyData.secretKey ||
                    keyData.secret ||
                    keyData.key ||
                    keyData;

                if (typeof secretKey === "string") {
                    secretKey = secretKey
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, "\\");

                    if (secretKey.startsWith('"') && secretKey.endsWith('"')) {
                        secretKey = secretKey.slice(1, -1);
                    }
                }

                if (secretKey && typeof secretKey === "string") {
                    setSetupKey(secretKey);
                }
            } else if (keyResponse.status !== 423) {
                // Only log if not a 423, as 423 is handled by the QR code fetch
                console.error(
                    "Failed to fetch secret key:",
                    keyResponse.status
                );
            }
        } catch (error) {
            console.error("Error fetching 2FA setup data:", error);
            setFetchError(
                "Failed to load two-factor authentication setup data. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchRecoveryCodes = async () => {
        try {
            const response = await fetch(route("two-factor.recovery-codes"), {
                method: "GET",
                headers: getHeaders(),
                credentials: "same-origin",
            });

            if (response.ok) {
                const codes = await response.json();
                setRecoveryCodes(Array.isArray(codes) ? codes : []);
            }
        } catch (error) {
            console.error("Error fetching recovery codes:", error);
        }
    };

    const enableTwoFactorAuthentication = () => {
        setEnabling(true);
        setFetchError(null);
        setSuccessMessage(null);

        enableForm.post(route("two-factor.enable"), {
            preserveScroll: true,
            onSuccess: () => {
                setEnabling(false);
                setSuccessMessage("Two-factor authentication enabled!");
                // Wait a moment for the database to update, then refresh
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            },
            onError: (errors) => {
                setEnabling(false);
                setFetchError(
                    "Failed to enable two-factor authentication. Please try again."
                );
            },
        });
    };

    const confirmTwoFactorAuthentication = () => {
        setConfirming(true);
        setFetchError(null);
        setSuccessMessage(null);

        confirmationForm.post(route("two-factor.confirm"), {
            preserveScroll: true,
            onSuccess: () => {
                setConfirming(false);
                confirmationForm.reset();
                setSuccessMessage(
                    "Two-factor authentication successfully confirmed!"
                );
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            },
            onError: (errors) => {
                setConfirming(false);
                // The backend usually provides specific error messages for invalid codes
                // So confirmationForm.errors.code will handle it.
            },
        });
    };

    const regenerateRecoveryCodes = () => {
        setSuccessMessage(null);
        regenerateForm.post(route("two-factor.regenerate-recovery-codes"), {
            preserveScroll: true,
            onSuccess: () => {
                fetchRecoveryCodes();
                setSuccessMessage("New recovery codes generated!");
            },
            onError: (errors) => {
                console.error("Error regenerating recovery codes:", errors);
                setFetchError(
                    "Failed to regenerate recovery codes. Please try again."
                );
            },
        });
    };

    const disableTwoFactorAuthentication = () => {
        setDisabling(true);
        setFetchError(null);
        setSuccessMessage(null);

        disableForm.delete(route("two-factor.disable"), {
            preserveScroll: true,
            onSuccess: () => {
                setDisabling(false);
                setSuccessMessage("Two-factor authentication disabled.");
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            },
            onError: (errors) => {
                setDisabling(false);
                setFetchError(
                    "Failed to disable two-factor authentication. Please try again."
                );
            },
        });
    };

    return (
        <section className={className}>
            <header>
                {/* Changed text-2xl to text-xl and mt-2 to mt-1 */}
                <h2 className="text-xl font-semibold text-gray-900">
                    Two-Factor Authentication (2FA)
                </h2>
                {/* Changed text-base to text-sm and mt-2 to mt-1 */}
                <p className="mt-1 text-sm text-gray-600">
                    Add an extra layer of security to your account by enabling
                    2FA.
                </p>
            </header>

            {/* Global Messages (Success/Error) */}
            {successMessage && (
                <div
                    className="mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg shadow-sm animate-fade-in"
                    role="alert"
                >
                    <p className="font-medium">{successMessage}</p>
                </div>
            )}

            {fetchError && (
                <div
                    className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm animate-fade-in"
                    role="alert"
                >
                    <p className="font-medium">{fetchError}</p>
                </div>
            )}

            {/* Changed mt-8 to mt-6 for slightly less vertical space */}
            <div className="mt-6 space-y-8">
                {twoFactorEnabled && !needsConfirmation ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                        <svg
                            className="w-5 h-5 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                        </svg>
                        <p className="text-sm font-semibold text-green-700">
                            You have successfully enabled two-factor
                            authentication.
                        </p>
                    </div>
                ) : (
                    <div className="max-w-xl text-base text-gray-600">
                        <p>
                            When two-factor authentication is enabled, you'll be
                            asked for a secure, time-based one-time password
                            (OTP) during login. You can generate this OTP from
                            an authenticator app like Google Authenticator or
                            Authy on your smartphone.
                        </p>
                    </div>
                )}

                {/* Enable Two Factor Authentication Section */}
                {!twoFactorEnabled && (
                    <div className="border-t pt-8">
                        <ConfirmsPassword
                            onConfirmed={enableTwoFactorAuthentication}
                        >
                            <PrimaryButton
                                disabled={enabling || enableForm.processing}
                                className="px-6 py-2"
                            >
                                {enabling || enableForm.processing
                                    ? "Enabling 2FA..."
                                    : "Enable Two-Factor Authentication"}
                            </PrimaryButton>
                        </ConfirmsPassword>
                    </div>
                )}

                {/* QR Code & Setup Key Section - Always show when 2FA is enabled */}
                {twoFactorEnabled && (
                    <div className="space-y-6 border-t pt-8">
                        <div>
                            {/* Changed text-xl to text-lg */}
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                1. Configure your authenticator app
                            </h3>
                            <p className="text-gray-600 mb-4">
                                To set up two-factor authentication, scan the QR
                                code below using your preferred authenticator
                                application (e.g., Google Authenticator, Authy,
                                Microsoft Authenticator).
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-6 bg-gray-100 border border-gray-200 rounded-lg shadow-inner min-h-[150px]">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-3"></div>
                                <p className="text-sm text-gray-500">
                                    Loading QR code and setup key...
                                </p>
                            </div>
                        ) : qrCode ? (
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                                <div className="p-2 border-2 border-indigo-500 rounded-lg bg-gray-50 flex-shrink-0">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: qrCode,
                                        }}
                                        className="qr-code-container"
                                        style={{
                                            lineHeight: 0,
                                            fontSize: 0,
                                            display: "block",
                                            width: "fit-content",
                                        }}
                                    />
                                </div>
                                {setupKey && (
                                    <div className="flex-grow text-center md:text-left">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            If you cannot scan the QR code,
                                            enter this setup key manually into
                                            your app:
                                        </p>
                                        <div className="font-mono text-sm bg-gray-100 text-gray-800 px-4 py-2 rounded-md border border-gray-300 break-all select-all">
                                            {setupKey}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 shadow-sm">
                                <p className="text-sm mb-3">
                                    The QR code and setup key require password
                                    confirmation for security reasons.
                                </p>
                                <ConfirmsPassword
                                    onConfirmed={fetchQrCodeAndSetupKey}
                                >
                                    <button className="text-sm font-medium text-yellow-900 hover:underline">
                                        Confirm Password to Load QR Code
                                    </button>
                                </ConfirmsPassword>
                            </div>
                        )}

                        {/* Confirmation Form - Only show if needs confirmation */}
                        {needsConfirmation && (
                            <div className="border-t pt-8">
                                {/* Changed text-xl to text-lg */}
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    2. Confirm your setup
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Enter the 6-digit code generated by your
                                    authenticator app to confirm that
                                    two-factor authentication has been set up
                                    correctly.
                                </p>

                                <div className="max-w-md space-y-6">
                                    <div>
                                        <InputLabel
                                            htmlFor="code"
                                            value="Authentication Code"
                                        />
                                        <TextInput
                                            id="code"
                                            type="text"
                                            className="mt-2 block w-full text-center tracking-widest text-lg"
                                            value={confirmationForm.data.code}
                                            onChange={(e) =>
                                                confirmationForm.setData(
                                                    "code",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="XXXXXX"
                                            maxLength="6"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={
                                                confirmationForm.errors.code
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <PrimaryButton
                                            onClick={
                                                confirmTwoFactorAuthentication
                                            }
                                            disabled={
                                                confirming ||
                                                confirmationForm.processing ||
                                                !confirmationForm.data.code ||
                                                confirmationForm.data.code
                                                    .length !== 6
                                            }
                                            className="px-6 py-2"
                                        >
                                            {confirming ||
                                            confirmationForm.processing
                                                ? "Confirming..."
                                                : "Confirm & Enable"}
                                        </PrimaryButton>

                                        <ConfirmsPassword
                                            onConfirmed={
                                                disableTwoFactorAuthentication
                                            }
                                        >
                                            <SecondaryButton
                                                disabled={
                                                    disabling ||
                                                    disableForm.processing
                                                }
                                                className="px-6 py-2"
                                            >
                                                {disabling ||
                                                disableForm.processing
                                                    ? "Canceling..."
                                                    : "Cancel Setup"}
                                            </SecondaryButton>
                                        </ConfirmsPassword>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recovery Codes Section - Only show if confirmed */}
                        {!needsConfirmation && recoveryCodes.length > 0 && (
                            <div className="border-t pt-8">
                                {/* Changed text-xl to text-lg */}
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    3. Your Recovery Codes
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    These recovery codes are essential for
                                    accessing your account if you lose your
                                    authenticator device. Please store them
                                    **securely** (e.g., in a password manager or
                                    printed and stored in a safe place). Each
                                    code can only be used once.
                                </p>

                                <div className="bg-gray-50 px-6 py-5 rounded-lg border border-gray-200 max-w-xl shadow-inner">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-base font-mono text-gray-800">
                                        {recoveryCodes.map((code, index) => (
                                            <div
                                                key={index}
                                                className="bg-white px-3 py-2 rounded border border-gray-200 shadow-sm"
                                            >
                                                {code}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons - Only show if confirmed */}
                        {!needsConfirmation && (
                            <div className="border-t pt-8">
                                {/* Changed text-xl to text-lg */}
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Additional Actions
                                </h3>
                                <div className="flex flex-wrap items-center gap-4">
                                    <ConfirmsPassword
                                        onConfirmed={regenerateRecoveryCodes}
                                    >
                                        <SecondaryButton
                                            disabled={regenerateForm.processing}
                                            className="px-6 py-2"
                                        >
                                            {regenerateForm.processing
                                                ? "Regenerating..."
                                                : "Regenerate Recovery Codes"}
                                        </SecondaryButton>
                                    </ConfirmsPassword>

                                    <ConfirmsPassword
                                        onConfirmed={
                                            disableTwoFactorAuthentication
                                        }
                                    >
                                        <DangerButton
                                            disabled={
                                                disabling ||
                                                disableForm.processing
                                            }
                                            className="px-6 py-2"
                                        >
                                            {disabling || disableForm.processing
                                                ? "Disabling..."
                                                : "Disable Two-Factor Authentication"}
                                        </DangerButton>
                                    </ConfirmsPassword>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default TwoFactorAuthenticationForm;