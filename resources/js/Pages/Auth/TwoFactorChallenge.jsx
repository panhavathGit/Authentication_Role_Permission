import { useForm } from '@inertiajs/react';

export default function TwoFactorChallenge() {
  const { data, setData, post, processing, errors } = useForm({
    code: '',
    recovery_code: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post('/two-factor-challenge');
  };

  return (
    // Full screen wrapper with flexbox centering
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="max-w-md w-full p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Two-Factor Authentication</h1>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Authentication Code
            </label>
            <input
              id="code"
              type="text"
              value={data.code}
              onChange={(e) => setData('code', e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
              autoComplete="one-time-code"
              disabled={!!data.recovery_code}
            />
            {errors.code && <div className="text-red-600 text-sm mt-1">{errors.code}</div>}
          </div>

          <div>
            <label htmlFor="recovery_code" className="block text-sm font-medium text-gray-700">
              Recovery Code (if you lost your device)
            </label>
            <input
              id="recovery_code"
              type="text"
              value={data.recovery_code}
              onChange={(e) => setData('recovery_code', e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
              autoComplete="one-time-code"
              disabled={!!data.code}
            />
            {errors.recovery_code && <div className="text-red-600 text-sm mt-1">{errors.recovery_code}</div>}
          </div>

          {errors.message && <div className="text-red-600 text-sm">{errors.message}</div>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            disabled={processing}
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
}


