<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Department;

class DepartmentController extends Controller
{
    public function index()
    {
        return response()->json(Department::withCount('users')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'code' => 'required|string|unique:departments,code',
            'description' => 'nullable|string',
        ]);

        return response()->json(Department::create($validated), 201);
    }
}
