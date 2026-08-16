<?php

namespace App\Services;

use App\Models\User;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Illuminate\Support\Facades\Log;

class WebPushService
{
    /**
     * Send a Web Push notification to a user's registered browser subscription using VAPID keys.
     *
     * @param User $user User model instance
     * @param string $title Notification title
     * @param string $body Notification message body
     * @param array $data Additional payload data (e.g. ticket_id, ticket_number)
     * @return bool True if push was sent successfully
     */
    public static function sendPush(User $user, string $title, string $body, array $data = []): bool
    {
        $sub = $user->push_subscription;
        if (!$sub || empty($sub['endpoint']) || empty($sub['keys']['p256dh']) || empty($sub['keys']['auth'])) {
            return false;
        }

        $publicKey = env('VAPID_PUBLIC_KEY');
        $privateKey = env('VAPID_PRIVATE_KEY');

        if (!$publicKey || !$privateKey) {
            Log::warning('WebPush skipped: VAPID keys not configured in .env');
            return false;
        }

        try {
            $subject = env('MAIL_FROM_ADDRESS', 'mailto:no-reply@techbridge.internal');
            if (!str_starts_with($subject, 'mailto:') && !str_starts_with($subject, 'http://') && !str_starts_with($subject, 'https://')) {
                $subject = 'mailto:' . $subject;
            }

            $auth = [
                'VAPID' => [
                    'subject' => $subject,
                    'publicKey' => $publicKey,
                    'privateKey' => $privateKey,
                ],
            ];

            $webPush = new WebPush($auth);
            $subscription = Subscription::create($sub);

            $payload = json_encode([
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'url' => isset($data['ticket_id']) ? '/?ticket_id=' . $data['ticket_id'] : '/',
            ]);

            $report = $webPush->sendOneNotification($subscription, $payload);

            if ($report->isSuccess()) {
                return true;
            } else {
                Log::info("WebPush dispatch result for user {$user->id}: {$report->getReason()}");
                // If subscription expired or un-registered, remove stale subscription from DB
                if ($report->isSubscriptionExpired()) {
                    $user->push_subscription = null;
                    $user->save();
                }
                return false;
            }
        } catch (\Throwable $e) {
            Log::error("WebPush exception for user {$user->id}: " . $e->getMessage());
            return false;
        }
    }
}
