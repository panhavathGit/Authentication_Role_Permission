<?php

namespace App\Http\Controllers\Auth;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Laravel\Fortify\Features;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Route;
use App\Http\Requests\Auth\LoginRequest;

class AuthenticatedSessionController extends Controller
{
    //original code
    // /**
    //  * Display the login view.
    //  */
    // public function create(): Response
    // {
    //     return Inertia::render('Auth/Login', [
    //         'canResetPassword' => Route::has('password.request'),
    //         'status' => session('status'),
    //     ]);
    // }

    // /**
    //  * Handle an incoming authentication request.
    //  */
    // public function store(LoginRequest $request): RedirectResponse
    // {
    //     $request->authenticate();

    //     $request->session()->regenerate();

    //     return redirect()->intended(route('dashboard', absolute: false));
    // }

    // Me trying to fix the code

    // public function store(LoginRequest $request): RedirectResponse
    // {
    //     $request->authenticate();

    //     $user = Auth::user();

    //     if (
    //         Features::enabled(Features::twoFactorAuthentication()) &&
    //         $user->two_factor_secret &&
    //         !$request->session()->has('auth.password_confirmed_at')
    //     ) {
    //         Auth::logout();

    //         $request->session()->put('login.id', $user->getKey());
    //         $request->session()->put('login.remember', $request->boolean('remember'));

    //         return redirect()->route('two-factor.login');
    //     }

    //     $request->session()->regenerate();

    //     return redirect()->intended(route('dashboard', absolute: false));
    // }


    // Final Code
        /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // Authenticate the user
        $request->authenticate();

        // Regenerate the session
        $request->session()->regenerate();

        $user = Auth::user();

        // If the user has 2FA enabled and has not yet confirmed this session, redirect to 2FA challenge
        if ($user->two_factor_secret && !$request->session()->get('auth.two_factor_confirmed')) {
            // Log out temporarily
            Auth::logout();

            // Store the user ID in session so we can identify them during 2FA challenge
            $request->session()->put('login.id', $user->getKey());

            // Redirect to the 2FA challenge route
            return redirect()->route('two-factor.login');
        }

        // If no 2FA is required or already confirmed, go to intended page
        return redirect()->intended(route('dashboard', absolute: false));
    }
    
    // /**
    //  * Destroy an authenticated session.
    //  */

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
    
}
