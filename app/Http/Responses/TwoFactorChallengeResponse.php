<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\TwoFactorChallengeViewResponse;
use Inertia\Inertia;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Http\Request;

class TwoFactorChallengeResponse implements TwoFactorChallengeViewResponse
{
    public function toResponse($request): HttpResponse
    {
        $inertiaResponse = Inertia::render('Auth/TwoFactorChallenge')->toResponse($request);

        // Convert to standard HTTP response if it's not already one
        if (! $inertiaResponse instanceof HttpResponse) {
            return new HttpResponse($inertiaResponse->getContent(), $inertiaResponse->getStatusCode(), $inertiaResponse->headers->all());
        }

        return $inertiaResponse;
    }
}
