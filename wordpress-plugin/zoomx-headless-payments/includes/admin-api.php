<?php
/**
 * Server-to-server endpoints for the ZOOM X admin dashboard (Next.js /admin).
 * Signed like the auth endpoints (zoomx_verify_signed_request): only the
 * storefront server can call them.
 *
 *   POST /zoomx/v1/auth/staff-login   { login, password } → staff profile
 *        Only users who can manage WooCommerce (shop managers, administrators).
 *   POST /zoomx/v1/admin/staff        { id } → staff profile if still allowed
 *   POST /zoomx/v1/admin/content      { content: {section: {field: value}} }
 *   POST /zoomx/v1/admin/page         { slug, page: {...} | null }
 *
 * Products, orders, customers and coupons go through WooCommerce's REST API
 * with the storefront's API key instead.
 */

defined('ABSPATH') || exit;

function zoomx_staff_payload(WP_User $user): array
{
    return [
        'id' => $user->ID,
        'email' => $user->user_email,
        'name' => trim($user->first_name . ' ' . $user->last_name) ?: $user->display_name,
    ];
}

function zoomx_is_staff(WP_User $user): bool
{
    return user_can($user, 'manage_woocommerce');
}

add_action('rest_api_init', function () {
    $ns = 'zoomx/v1';
    $common = ['methods' => 'POST', 'permission_callback' => 'zoomx_verify_signed_request'];

    register_rest_route($ns, '/auth/staff-login', $common + [
        'callback' => function (WP_REST_Request $r) {
            $user = wp_authenticate(
                sanitize_text_field((string) $r->get_param('login')),
                (string) $r->get_param('password')
            );
            // Same answer for wrong password and non-staff accounts.
            if (is_wp_error($user) || !zoomx_is_staff($user)) {
                return new WP_Error('invalid_credentials', 'Incorrect email or password.', ['status' => 401]);
            }
            return zoomx_staff_payload($user);
        },
    ]);

    // Re-checked on every admin request, so removing someone's role locks them out at once.
    register_rest_route($ns, '/admin/staff', $common + [
        'callback' => function (WP_REST_Request $r) {
            $user = get_user_by('id', (int) $r->get_param('id'));
            if (!$user || !zoomx_is_staff($user)) {
                return new WP_Error('not_staff', 'Not allowed.', ['status' => 403]);
            }
            return zoomx_staff_payload($user);
        },
    ]);

    // Raw saved fields (as typed), for the admin editor.
    register_rest_route($ns, '/admin/content-raw', $common + [
        'callback' => fn() => (object) zoomx_content_get(),
    ]);

    register_rest_route($ns, '/admin/content', $common + [
        'callback' => function (WP_REST_Request $r) {
            $content = $r->get_param('content');
            if (!is_array($content)) return new WP_Error('invalid_request', 'Invalid request.', ['status' => 400]);
            // The sanitizer expects slashed form input.
            update_option(ZOOMX_CONTENT_OPTION, zoomx_content_sanitize(wp_slash($content)), false);
            return zoomx_content_get();
        },
    ]);

    register_rest_route($ns, '/admin/page', $common + [
        'callback' => function (WP_REST_Request $r) {
            $slug = (string) $r->get_param('slug');
            if (!isset(zoomx_pages_list()[$slug])) return new WP_Error('invalid_request', 'Unknown page.', ['status' => 400]);
            $all = zoomx_pages_get();
            $page = $r->get_param('page');
            if (is_array($page)) {
                $clean = zoomx_pages_sanitize(wp_slash($page));
                if ($clean) $all[$slug] = $clean; else unset($all[$slug]);
            } else {
                unset($all[$slug]); // null = restore the standard text
            }
            update_option(ZOOMX_PAGES_OPTION, $all, false);
            return (object) ($all[$slug] ?? []);
        },
    ]);
});
