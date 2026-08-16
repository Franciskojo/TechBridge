<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Team;
use App\Models\ITSystem;
use App\Models\TicketCategory;
use App\Models\KnowledgeArticle;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Departments
        $finance = Department::create(['name' => 'Finance & Accounting', 'code' => 'FIN', 'description' => 'Financial operations and billing']);
        $engineering = Department::create(['name' => 'Software Engineering', 'code' => 'ENG', 'description' => 'Product development and tech infrastructure']);
        $hr = Department::create(['name' => 'Human Resources', 'code' => 'HR', 'description' => 'Personnel and onboarding']);
        $ops = Department::create(['name' => 'Operations & Logistics', 'code' => 'OPS', 'description' => 'Supply chain and facilities']);

        // 2. Technical Teams
        $tier1 = Team::create(['name' => 'Service Desk Tier 1', 'code' => 'SD-T1', 'sla_tier' => 'Standard']);
        $infraTeam = Team::create(['name' => 'Cloud & Infrastructure', 'code' => 'INFRA', 'sla_tier' => 'Critical']);
        $secTeam = Team::create(['name' => 'Information Security', 'code' => 'SEC', 'sla_tier' => 'Critical']);

        // 3. User Logins
        // All pre-seeded users removed: Users are created via Postman / Register API.

        // 4. IT Systems
        ITSystem::create(['name' => 'Corporate Single Sign-On (SSO)', 'code' => 'SSO', 'status' => 'operational', 'owner_team_id' => $secTeam->id]);
        ITSystem::create(['name' => 'Enterprise ERP Platform', 'code' => 'ERP', 'status' => 'operational', 'owner_team_id' => $infraTeam->id]);
        ITSystem::create(['name' => 'Remote Access VPN Gateway', 'code' => 'VPN', 'status' => 'degraded', 'owner_team_id' => $infraTeam->id]);
        ITSystem::create(['name' => 'Exchange & Cloud Email', 'code' => 'MAIL', 'status' => 'operational', 'owner_team_id' => $tier1->id]);

        // 5. Ticket Categories
        $catLogin = TicketCategory::create(['name' => 'Login and Authentication', 'slug' => 'login-auth', 'icon' => 'lock']);
        $catApp = TicketCategory::create(['name' => 'Application Error', 'slug' => 'app-error', 'icon' => 'alert-triangle']);
        $catNet = TicketCategory::create(['name' => 'Network and Internet', 'slug' => 'network', 'icon' => 'wifi']);
        TicketCategory::create(['name' => 'User Access & Permissions', 'slug' => 'access', 'icon' => 'user-check']);
        TicketCategory::create(['name' => 'Hardware & Peripheral', 'slug' => 'hardware', 'icon' => 'monitor']);

        // 6. Default Knowledge Base Reference Articles
        KnowledgeArticle::create([
            'title' => 'How to Reset Your Enterprise SSO & VPN Password Self-Service',
            'slug' => 'sso-vpn-password-reset',
            'category_id' => $catLogin->id,
            'body' => "## Self-Service Password Reset Guide\n\nIf you are locked out of your account or your password has expired, follow these steps:\n1. Navigate to `https://sso.techbridge.internal/reset`.\n2. Enter your corporate email address.\n3. Verify identity using your Authenticator App push notification.\n4. Enter your new password meeting the 16-character complexity policy.\n\n> **Tip:** If the push notification doesn't arrive within 2 minutes, open your Authenticator app and manually copy the TOTP code instead.",
            'tags' => ['sso', 'password', 'vpn', 'reset'],
            'status' => 'published',
            'views' => 142,
            'helpful_count' => 38,
        ]);

        KnowledgeArticle::create([
            'title' => 'Troubleshooting Remote VPN Connection Timeouts & MFA Delays',
            'slug' => 'troubleshooting-vpn-mfa-timeouts',
            'category_id' => $catNet->id,
            'body' => "## Resolving VPN Connection Drops\n\n- Ensure Cisco / Fortinet VPN client is updated to version **5.4+**.\n- Verify system clock is synchronized to automatic network time (NTP).\n- Try toggling Wi-Fi / Ethernet interface before launching a new connection.\n- If MFA push is delayed >2 min, use your TOTP token directly.\n\n### Still failing?\nOpen a support ticket with your VPN client version, OS version, and connection logs from `%APPDATA%/VPN/logs`.",
            'tags' => ['vpn', 'network', 'mfa', 'timeout'],
            'status' => 'published',
            'views' => 89,
            'helpful_count' => 24,
        ]);

        KnowledgeArticle::create([
            'title' => 'ERP Export Feature — Known Limitations & Workarounds',
            'slug' => 'erp-export-known-limitations',
            'category_id' => $catApp->id,
            'body' => "## ERP Financial Reports Export\n\n### Known Issues\n- Exports of ledgers with >10,000 rows may trigger a timeout (HTTP 500).\n- PDF export requires **Adobe Acrobat Reader** browser plugin enabled.\n\n### Workarounds\n1. Filter date range to ≤3 months to reduce row count before exporting.\n2. Use **CSV format** instead of PDF for large datasets.\n3. If export fails, retry after 20 minutes (scheduled cache refresh).",
            'tags' => ['erp', 'export', 'pdf', 'workaround'],
            'status' => 'published',
            'views' => 56,
            'helpful_count' => 19,
        ]);
    }
}
