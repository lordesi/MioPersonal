<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Laravel\Fortify\Http\Responses\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Http\Responses\SuccessfulPasswordResetLinkRequestResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * "Password dimenticata?" with an email that has no account: we answer as if
 * the link was sent, so nobody can find out who is signed up. Other failures
 * (a link asked less than a minute ago) are still shown as errors.
 */
class FailedPasswordResetLinkResponse extends FailedPasswordResetLinkRequestResponse
{
    /**
     * @param  Request  $request
     * @return Response
     */
    public function toResponse($request)
    {
        if ($this->status === Password::INVALID_USER) {
            return (new SuccessfulPasswordResetLinkRequestResponse(Password::RESET_LINK_SENT))->toResponse($request);
        }

        return parent::toResponse($request);
    }
}
