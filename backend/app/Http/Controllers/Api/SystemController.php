<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ITSystem;

class SystemController extends Controller
{
    public function publicIndex()
    {
        return response()->json(ITSystem::all());
    }

    public function index()
    {
        return response()->json(ITSystem::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'code' => 'required|string|unique:systems,code',
            'description' => 'nullable|string',
            'status' => 'nullable|in:operational,degraded,outage,maintenance',
        ]);

        return response()->json(ITSystem::create($validated), 201);
    }
}
