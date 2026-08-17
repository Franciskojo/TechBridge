<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'TechBridge Enterprise PWA API Engine',
        'status' => 'online',
        'version' => '1.0.0-Laravel13'
    ]);
});

Route::match(['get', 'head'], '/health', fn () => response()->json(['status' => 'ok', 'service' => 'TechBridge API'], 200));
Route::match(['get', 'head'], '/api/health', fn () => response()->json(['status' => 'ok', 'service' => 'TechBridge API'], 200));

