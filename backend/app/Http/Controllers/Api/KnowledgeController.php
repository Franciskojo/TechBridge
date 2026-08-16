<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\KnowledgeArticle;
use App\Models\Ticket;
use App\Models\AuditLog;
use App\Services\TicketService;
use Illuminate\Support\Str;

class KnowledgeController extends Controller
{
    public function index(Request $request)
    {
        $query = KnowledgeArticle::with(['category', 'author'])->where('status', 'published');

        if ($request->filled('search')) {
            $escaped = TicketService::escapeLikePattern($request->search);
            $query->where(function ($q) use ($escaped) {
                $q->where('title', 'like', "%{$escaped}%")
                  ->orWhere('body', 'like', "%{$escaped}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return response()->json($query->orderBy('helpful_count', 'desc')->paginate(12));
    }

    public function show($id)
    {
        $article = KnowledgeArticle::with(['category', 'author'])->findOrFail($id);
        $article->increment('views');
        return response()->json($article);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:50000',
            'category_id' => 'nullable|uuid',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'status' => 'nullable|in:draft,published,archived',
        ]);

        $user = $request->user();

        if ($user->role === 'Employee') {
            return response()->json(['message' => 'Unauthorized to create knowledge articles.'], 403);
        }

        $article = KnowledgeArticle::create([
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title'] . '-' . Str::random(4)),
            'body' => $validated['body'],
            'category_id' => $validated['category_id'] ?? null,
            'author_id' => $user->id,
            'tags' => $validated['tags'] ?? null,
            'status' => $validated['status'] ?? 'published',
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'action' => 'KB_ARTICLE_CREATED',
            'resource_type' => 'KnowledgeArticle',
            'resource_id' => (string) $article->id,
            'new_values' => ['title' => $article->title],
            'ip_address' => $request->ip(),
        ]);

        return response()->json($article, 201);
    }

    public function suggestArticles(Request $request)
    {
        $q = $request->query('query', '');
        if (strlen($q) < 3) {
            return response()->json([]);
        }

        $escaped = TicketService::escapeLikePattern($q);
        $articles = KnowledgeArticle::where('status', 'published')
            ->where(function ($query) use ($escaped) {
                $query->where('title', 'like', "%{$escaped}%")
                      ->orWhere('body', 'like', "%{$escaped}%");
            })
            ->limit(4)
            ->get(['id', 'title', 'slug', 'views', 'helpful_count']);

        return response()->json($articles);
    }

    public function convertFromTicket(Request $request, $ticketId)
    {
        $ticket = Ticket::findOrFail($ticketId);
        $user = $request->user();

        if ($user->role === 'Employee') {
            return response()->json(['message' => 'Unauthorized to convert tickets to KB articles.'], 403);
        }

        $article = KnowledgeArticle::create([
            'title' => 'Resolution: ' . $ticket->title,
            'slug' => Str::slug('res-' . $ticket->ticket_number . '-' . Str::random(4)),
            'category_id' => $ticket->category_id,
            'author_id' => $user->id,
            'body' => "## Problem Description\n" . $ticket->description . "\n\n## Root Cause\n" . ($ticket->root_cause ?? 'Under investigation') . "\n\n## Solution / Resolution Summary\n" . ($ticket->resolution_summary ?? 'See ticket details'),
            'status' => 'published',
            'source_ticket_id' => $ticket->id,
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'action' => 'KB_ARTICLE_FROM_TICKET',
            'resource_type' => 'KnowledgeArticle',
            'resource_id' => (string) $article->id,
            'new_values' => ['source_ticket' => $ticket->ticket_number],
            'ip_address' => $request->ip(),
        ]);

        return response()->json($article, 201);
    }

    /**
     * Rate an article as helpful/unhelpful.
     * Uses a simple per-user tracking via cache to prevent unlimited voting.
     */
    public function rateArticle(Request $request, $id)
    {
        $article = KnowledgeArticle::findOrFail($id);
        $user = $request->user();
        $helpful = $request->boolean('helpful');

        // Prevent duplicate votes via cache (per user per article)
        $cacheKey = "kb_vote:{$user->id}:{$id}";
        if (cache()->has($cacheKey)) {
            return response()->json([
                'message' => 'You have already rated this article.',
                'helpful_count' => $article->helpful_count,
                'unhelpful_count' => $article->unhelpful_count,
            ], 409);
        }

        if ($helpful) {
            $article->increment('helpful_count');
        } else {
            $article->increment('unhelpful_count');
        }

        // Cache the vote for 30 days
        cache()->put($cacheKey, true, now()->addDays(30));

        return response()->json([
            'helpful_count' => $article->fresh()->helpful_count,
            'unhelpful_count' => $article->fresh()->unhelpful_count,
        ]);
    }
}
