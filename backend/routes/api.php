<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\KnowledgeController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\SystemController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Api\NotificationController;

// ── Health Check (public, no auth) — used by PWA connectivity ping ────
Route::match(['get', 'head'], '/health', fn () => response()->json(['status' => 'ok', 'service' => 'TechBridge API'], 200));

/*
|--------------------------------------------------------------------------
| TechBridge REST API Routes (V1)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ── Public Auth Endpoints ──────────────────────────────────────────
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);

    // Public reference data for ticket creation wizard
    Route::get('/public/categories', [TicketController::class, 'publicCategories']);
    Route::get('/public/systems', [SystemController::class, 'publicIndex']);
    Route::get('/public/kb-suggest', [KnowledgeController::class, 'suggestArticles']);

    // ── Authenticated Routes (all roles) ───────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // User & Session
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
        Route::post('/auth/push-subscription', [AuthController::class, 'updatePushSubscription']);

        // ── In-App Notifications ──────────────────────────────────────
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);

        // ── Employee-accessible Dashboards ─────────────────────────────
        Route::get('/dashboards/employee', [DashboardController::class, 'employee']);

        // ── Ticket Operations (all authenticated users) ────────────────
        Route::get('/tickets', [TicketController::class, 'index']);
        Route::post('/tickets', [TicketController::class, 'store']);
        Route::get('/tickets/{id}', [TicketController::class, 'show']);
        Route::post('/tickets/{id}/comments', [TicketController::class, 'addComment']);
        Route::post('/tickets/{id}/attachments', [TicketController::class, 'uploadAttachment']);
        Route::post('/tickets/{id}/rate', [TicketController::class, 'rateResolution']);

        // Offline Batch Sync Endpoint
        Route::post('/tickets/sync', [SyncController::class, 'batchSync']);

        // Knowledge Base (read access for all)
        Route::get('/knowledge-articles', [KnowledgeController::class, 'index']);
        Route::get('/knowledge-articles/{id}', [KnowledgeController::class, 'show']);
        Route::post('/knowledge-articles/{id}/rate', [KnowledgeController::class, 'rateArticle']);

        // Reference data
        Route::get('/departments', [DepartmentController::class, 'index']);
        Route::get('/systems', [SystemController::class, 'index']);

        // ── Technician+ Routes ─────────────────────────────────────────
        Route::middleware('role:Technician,TeamLead,Admin')->group(function () {
            Route::get('/dashboards/technician', [DashboardController::class, 'technician']);
            Route::put('/tickets/{id}', [TicketController::class, 'update']);
            Route::match(['put', 'patch'], '/tickets/{id}/status', [TicketController::class, 'changeStatus']);
            Route::match(['put', 'patch'], '/tickets/{id}/assign', [TicketController::class, 'assignTechnician']);
            Route::patch('/tickets/{id}/escalate', [TicketController::class, 'escalate']);
            Route::post('/tickets/{id}/convert-to-kb', [KnowledgeController::class, 'convertFromTicket']);
            Route::post('/knowledge-articles', [KnowledgeController::class, 'store']);
        });

        // ── Team Lead+ Routes ──────────────────────────────────────────
        Route::middleware('role:TeamLead,Admin')->group(function () {
            Route::get('/dashboards/team-lead', [DashboardController::class, 'teamLead']);
        });

        // ── Admin-only Routes ──────────────────────────────────────────
        Route::middleware('role:Admin')->group(function () {
            Route::get('/dashboards/admin', [DashboardController::class, 'admin']);

            // User management
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::put('/users/{id}', [UserController::class, 'update']);

            // Department management
            Route::post('/departments', [DepartmentController::class, 'store']);

            // System management
            Route::post('/systems', [SystemController::class, 'store']);

            // Audit Trail & Reports
            Route::get('/audit-logs', [AuditLogController::class, 'index']);
            Route::get('/reports/summary', [ReportController::class, 'summary']);
            Route::get('/reports/export-csv', [ReportController::class, 'exportCsv']);
        });
    });
});
