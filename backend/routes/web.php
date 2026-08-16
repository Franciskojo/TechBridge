<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'TechBridge Enterprise PWA API Engine',
        'status' => 'online',
        'version' => '1.0.0-Laravel13'
    ]);
});
