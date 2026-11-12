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

    // Product / category photo upload from the admin: { filename, data (base64), alt }.
    register_rest_route($ns, '/admin/media', $common + [
        'callback' => function (WP_REST_Request $r) {
            $name = sanitize_file_name((string) $r->get_param('filename'));
            $bytes = base64_decode((string) $r->get_param('data'), true);
            if ($name === '' || $bytes === false || strlen($bytes) === 0) {
                return new WP_Error('invalid_request', 'Invalid upload.', ['status' => 400]);
            }
            if (strlen($bytes) > 5 * 1024 * 1024) {
                return new WP_Error('invalid_request', 'Images must be 5 MB or smaller.', ['status' => 400]);
            }
            // Trust the bytes, not the name: only real JPEG / PNG / WebP images.
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_buffer($finfo, $bytes);
            finfo_close($finfo);
            $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$mime] ?? null;
            if (!$ext) return new WP_Error('invalid_request', 'Use a JPG, PNG or WebP image.', ['status' => 400]);
            $name = preg_replace('/\.[^.]*$/', '', $name) . '.' . $ext;

            $upload = wp_upload_bits($name, null, $bytes);
            if (!empty($upload['error'])) return new WP_Error('upload_failed', 'Upload failed.', ['status' => 500]);
            require_once ABSPATH . 'wp-admin/includes/image.php';
            $id = wp_insert_attachment([
                'post_mime_type' => $mime,
                'post_title' => sanitize_text_field(preg_replace('/\.[^.]*$/', '', $name)),
                'post_status' => 'inherit',
            ], $upload['file']);
            wp_update_attachment_metadata($id, wp_generate_attachment_metadata($id, $upload['file']));
            update_post_meta($id, '_wp_attachment_image_alt', sanitize_text_field((string) $r->get_param('alt')));
            return ['id' => $id, 'src' => wp_get_attachment_url($id)];
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
