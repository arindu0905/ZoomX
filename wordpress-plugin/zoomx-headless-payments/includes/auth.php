<?php
/**
 * Server-to-server customer authentication for the ZOOM X storefront.
 *
 * The storefront (Next.js) calls these endpoints from its server only. Each
 * request is signed: X-ZoomX-Signature = hex(HMAC-SHA256(timestamp + "." +
 * raw body, ZOOMX_HEADLESS_SECRET)) with X-ZoomX-Timestamp within 5 minutes.
 * Passwords are verified and stored by WordPress core (wp_authenticate,
 * wc_create_new_customer, reset_password) — never by the storefront.
 *
 * Secret: define('ZOOMX_HEADLESS_SECRET', '…') in wp-config.php (preferred),
 * or the `zoomx_headless_secret` option. Storefront URL (for reset links):
 * define('ZOOMX_STOREFRONT_URL', 'https://zoomx.lk') or option `zoomx_storefront_url`.
 */

defined('ABSPATH') || exit;

function zoomx_headless_secret(): string
{
    if (defined('ZOOMX_HEADLESS_SECRET') && ZOOMX_HEADLESS_SECRET) {
        return (string) ZOOMX_HEADLESS_SECRET;
    }
    return (string) get_option('zoomx_headless_secret', '');
}

function zoomx_storefront_url(): string
{
    $url = defined('ZOOMX_STOREFRONT_URL') ? ZOOMX_STOREFRONT_URL : get_option('zoomx_storefront_url', '');
    return untrailingslashit((string) $url);
}

/** permission_callback: valid, fresh HMAC signature or nothing. */
function zoomx_verify_signed_request(WP_REST_Request $request)
{
    $secret = zoomx_headless_secret();
    if (strlen($secret) < 32) {
        return new WP_Error('zoomx_not_configured', 'Not configured.', ['status' => 503]);
    }
    $ts = (string) $request->get_header('x_zoomx_timestamp');
    $sig = (string) $request->get_header('x_zoomx_signature');
    if (!ctype_digit($ts) || abs(time() - (int) $ts) > 300 || $sig === '') {
        return new WP_Error('zoomx_unauthorized', 'Unauthorized.', ['status' => 401]);
    }
    $expected = hash_hmac('sha256', $ts . '.' . $request->get_body(), $secret);
    if (!hash_equals($expected, strtolower($sig))) {
        return new WP_Error('zoomx_unauthorized', 'Unauthorized.', ['status' => 401]);
    }
    return true;
}

function zoomx_customer_payload(WP_User $user): array
{
    return [
        'id' => $user->ID,
        'email' => $user->user_email,
        'first_name' => (string) get_user_meta($user->ID, 'first_name', true),
        'last_name' => (string) get_user_meta($user->ID, 'last_name', true),
    ];
}

add_action('rest_api_init', function () {
    $ns = 'zoomx/v1';
    $common = ['methods' => 'POST', 'permission_callback' => 'zoomx_verify_signed_request'];

    register_rest_route($ns, '/auth/login', $common + [
        'callback' => function (WP_REST_Request $r) {
            $login = sanitize_text_field((string) $r->get_param('login'));
            $password = (string) $r->get_param('password');
            // wp_authenticate runs core checks plus any lockout/2FA plugins hooked into it.
            $user = wp_authenticate($login, $password);
            if (is_wp_error($user)) {
                return new WP_Error('invalid_credentials', 'Incorrect email or password.', ['status' => 401]);
            }
            // Staff accounts sign in to wp-admin, not the storefront.
            if (user_can($user, 'edit_posts') || user_can($user, 'manage_woocommerce')) {
                return new WP_Error('invalid_credentials', 'Incorrect email or password.', ['status' => 401]);
            }
            return zoomx_customer_payload($user);
        },
    ]);

    register_rest_route($ns, '/auth/register', $common + [
        'callback' => function (WP_REST_Request $r) {
            if ('yes' !== get_option('woocommerce_enable_myaccount_registration', 'no')) {
                return new WP_Error('registration_disabled', 'Registration is not available.', ['status' => 403]);
            }
            $email = sanitize_email((string) $r->get_param('email'));
            $password = (string) $r->get_param('password');
            if (!is_email($email) || strlen($password) < 8) {
                return new WP_Error('invalid_request', 'Invalid request.', ['status' => 400]);
            }
            $id = wc_create_new_customer($email, '', $password, [
                'first_name' => sanitize_text_field((string) $r->get_param('first_name')),
                'last_name' => sanitize_text_field((string) $r->get_param('last_name')),
            ]);
            if (is_wp_error($id)) {
                // Don't reveal whether the email is registered.
                return new WP_Error('registration_failed', 'We couldn’t create an account with those details.', ['status' => 400]);
            }
            return zoomx_customer_payload(get_user_by('id', $id));
        },
    ]);

    register_rest_route($ns, '/auth/lost-password', $common + [
        'callback' => function (WP_REST_Request $r) {
            $login = sanitize_text_field((string) $r->get_param('login'));
            if ($login !== '') {
                // Sends WordPress's reset email (link rewritten to the storefront below).
                retrieve_password($login);
            }
            // Same response whether or not the account exists.
            return ['ok' => true];
        },
    ]);

    register_rest_route($ns, '/auth/reset-password', $common + [
        'callback' => function (WP_REST_Request $r) {
            $login = sanitize_text_field((string) $r->get_param('login'));
            $key = sanitize_text_field((string) $r->get_param('key'));
            $password = (string) $r->get_param('password');
            if (strlen($password) < 8) {
                return new WP_Error('invalid_request', 'Invalid request.', ['status' => 400]);
            }
            $user = check_password_reset_key($key, $login);
            if (is_wp_error($user)) {
                return new WP_Error('invalid_key', 'This reset link is invalid or has expired.', ['status' => 400]);
            }
            reset_password($user, $password);
            return ['ok' => true];
        },
    ]);
});

/** Point password-reset emails at the storefront instead of wp-login.php. */
add_filter('retrieve_password_message', function ($message, $key, $user_login) {
    $storefront = zoomx_storefront_url();
    if ($storefront === '') {
        return $message;
    }
    $link = $storefront . '/account/reset?key=' . rawurlencode($key) . '&login=' . rawurlencode($user_login);
    return preg_replace('#https?://\S*wp-login\.php\?action=rp\S*#', $link, $message);
}, 10, 3);
