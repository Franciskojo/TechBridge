<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\SystemController;

Route::get('/', function () {
    return response()->json([
        'app' => 'TechBridge Enterprise PWA API Engine',
        'status' => 'online',
        'version' => '1.0.0-Laravel13'
    ]);
});

Route::match(['get', 'head'], '/health', fn () => response()->json(['status' => 'ok', 'service' => 'TechBridge API'], 200));
Route::match(['get', 'head'], '/api/health', fn () => response()->json(['status' => 'ok', 'service' => 'TechBridge API'], 200));

// Alias routes (allows frontend to call /auth/* or /api/v1/auth/*)
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::get('/public/categories', [TicketController::class, 'publicCategories']);
Route::get('/public/systems', [SystemController::class, 'publicIndex']);


