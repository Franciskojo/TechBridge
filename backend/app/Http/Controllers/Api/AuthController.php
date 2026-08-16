<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use App\Models\User;
use App\Models\AuditLog;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Rate limiting: 5 attempts per minute per email
        $throttleKey = 'login:' . strtolower($credentials['email']);
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'message' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ], 429);
        }

        $user = User::with(['department', 'team'])->where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($throttleKey, 60);
            return response()->json(['message' => 'Invalid email or password credentials.'], 401);
        }

        // Clear rate limiter on successful login
        RateLimiter::clear($throttleKey);

        $token = $user->createToken('techbridge-pwa-token')->plainTextToken;

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'action' => 'USER_LOGIN',
            'resource_type' => 'User',
            'resource_id' => (string) $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Public self-registration.
     * - 'Employee' role: open, no secret required.
     * - Elevated roles (Technician, TeamLead, Admin): require a valid ADMIN_REGISTER_SECRET
     *   checked server-side. The frontend must NOT hard-code this value.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users,email',
            'password'      => 'required|string|min:8|confirmed',
            'department_id' => 'nullable|uuid|exists:departments,id',
            'job_title'     => 'nullable|string|max:255',
            'role'          => 'nullable|string|in:Employee,Technician,TeamLead,Admin',
            'admin_secret'  => 'nullable|string',
        ]);

        $role = $validated['role'] ?? 'Employee';

        // ── Server-side secret gate for elevated roles ──────────────────────
        if (in_array($role, ['Technician', 'TeamLead', 'Admin'], true)) {
            $provided = $validated['admin_secret'] ?? '';
            $expected = config('app.admin_register_secret', '');

            if (empty($expected) || !hash_equals($expected, $provided)) {
                return response()->json([
                    'message' => 'Invalid or missing admin registration secret.',
                ], 403);
            }
        }

        $user = User::create([
            'name'          => $validated['name'],
            'email'         => $validated['email'],
            'password'      => Hash::make($validated['password']),
            'role'          => $role,
            'department_id' => $validated['department_id'] ?? null,
            'job_title'     => $validated['job_title'] ?? 'Staff Member',
        ]);

        $token = $user->createToken('techbridge-pwa-token')->plainTextToken;

        AuditLog::create([
            'actor_id'      => $user->id,
            'actor_name'    => $user->name,
            'action'        => 'USER_REGISTERED',
            'resource_type' => 'User',
            'resource_id'   => (string) $user->id,
            'ip_address'    => $request->ip(),
        ]);

        return response()->json([
            'user'  => $user->load(['department', 'team']),
            'token' => $token,
        ], 201);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['department', 'team']);
        return response()->json(['user' => $user]);
    }

    public function logout(Request $request)
    {
        AuditLog::create([
            'actor_id' => $request->user()->id,
            'actor_name' => $request->user()->name,
            'action' => 'USER_LOGOUT',
            'resource_type' => 'User',
            'resource_id' => (string) $request->user()->id,
            'ip_address' => $request->ip(),
        ]);

        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:8|confirmed|different:current_password',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        // Revoke all other tokens (force re-login on other devices)
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        AuditLog::create([
            'actor_id'      => $user->id,
            'actor_name'    => $user->name,
            'action'        => 'USER_CHANGED_PASSWORD',
            'resource_type' => 'User',
            'resource_id'   => (string) $user->id,
            'ip_address'    => $request->ip(),
            'user_agent'    => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function updatePushSubscription(Request $request)
    {
        $validated = $request->validate([
            'subscription' => 'required|array',
        ]);

        $user = $request->user();
        $user->push_subscription = $validated['subscription'];
        $user->save();

        return response()->json(['message' => 'Push subscription saved successfully']);
    }
}
