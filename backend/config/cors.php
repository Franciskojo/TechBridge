<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Set CORS_ALLOWED_ORIGINS in .env — comma-separated, no trailing slashes.
    // Example: https://techbridge.yourdomain.com,https://www.techbridge.yourdomain.com
    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000')),

    'allowed_origins_patterns' => [],

    // Explicit headers only — never use ['*'] in production
    'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'X-XSRF-TOKEN'],

    'exposed_headers' => ['Content-Disposition'],

    // Cache preflight response for 24 hours to reduce OPTIONS round-trips
    'max_age' => 86400,

    'supports_credentials' => true,
];

