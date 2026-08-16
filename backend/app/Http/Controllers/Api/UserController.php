<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(User::with(['department', 'team'])->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:Employee,Technician,TeamLead,Admin',
            'department_id' => 'nullable|uuid',
            'job_title' => 'nullable|string',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $user = User::create($validated);

        return response()->json($user, 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'name' => 'nullable|string',
            'role' => 'nullable|in:Employee,Technician,TeamLead,Admin',
            'department_id' => 'nullable|uuid',
            'job_title' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $user->update($validated);
        return response()->json($user);
    }
}
