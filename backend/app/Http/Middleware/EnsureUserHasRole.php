<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to enforce role-based access control on routes.
 * 
 * Usage in routes: ->middleware('role:Admin') or ->middleware('role:Admin,TeamLead')
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Authentication required.'], 401);
        }

        if (!in_array($user->role, $roles, true)) {
            return response()->json([
                'message' => 'Forbidden. This action requires one of the following roles: ' . implode(', ', $roles) . '.',
            ], 403);
        }

        return $next($request);
    }
}
