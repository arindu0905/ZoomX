<?php
/**
 * Editable storefront content ("ZOOM X → Site content" in wp-admin).
 *
 * The ZOOM X team edits the announcement bar and the homepage copy here
 * instead of in code. The storefront reads it from a public, read-only
 * endpoint and falls back to its built-in copy for any empty field:
 *
 *   GET /wp-json/zoomx/v1/content
 *
 * Saving asks the storefront to refresh (POST {storefront}/api/content/refresh),
 * signed exactly like the auth calls: X-ZoomX-Signature =
 * hex(HMAC-SHA256(timestamp + "." + body, ZOOMX_HEADLESS_SECRET)).
 */

defined('ABSPATH') || exit;

const ZOOMX_CONTENT_OPTION = 'zoomx_site_content';

/**
 * Field schema: section => [field => [label, type, help]].
 * Types: text, textarea (one paragraph), lines (one item per line), link (/path or https://), checkbox.
 */
function zoomx_content_schema(): array
{
    $pairs = function (string $prefix, string $label, int $n): array {
        $out = [];
        for ($i = 1; $i <= $n; $i++) {
            $out["{$prefix}_{$i}_title"] = ["$label $i — title", 'text', ''];
            $out["{$prefix}_{$i}_body"] = ["$label $i — text", 'textarea', ''];
        }
        return $out;
    };

    return [
        'announcement' => [
            'title' => 'Announcement bar',
            'help' => 'The strip above the menu. Leave the message empty to keep the standard text.',
            'fields' => [
                'hide' => ['Hide the bar', 'checkbox', 'Tick to show no announcement at all.'],
                'message' => ['Message', 'text', 'e.g. a delivery note or promotion — only what the business has confirmed.'],
                'link_label' => ['Link text', 'text', 'Optional.'],
                'link_href' => ['Link address', 'link', 'A site path like /shop, or a full https:// address.'],
            ],
        ],
        'hero' => [
            'title' => 'Homepage — top banner',
            'fields' => [
                'eyebrow' => ['Small line above the headline', 'text', ''],
                'title' => ['Headline', 'text', ''],
                'lead' => ['Intro sentence', 'textarea', ''],
                'primary_label' => ['Main button text', 'text', ''],
                'primary_href' => ['Main button link', 'link', ''],
                'secondary_label' => ['Second button text', 'text', ''],
                'secondary_href' => ['Second button link', 'link', ''],
            ],
        ],
        'business' => [
            'title' => 'Homepage — For businesses block',
            'fields' => [
                'eyebrow' => ['Small line above the heading', 'text', ''],
                'title' => ['Heading', 'text', ''],
                'lead' => ['Text', 'textarea', ''],
                'points' => ['Ticked points', 'lines', 'One point per line.'],
                'cta_label' => ['Button text', 'text', ''],
                'cta_href' => ['Button link', 'link', ''],
            ],
        ],
        'story' => [
            'title' => 'Homepage — Our story',
            'fields' => array_merge([
                'eyebrow' => ['Small line above the heading', 'text', ''],
                'title' => ['Heading', 'text', ''],
                'paragraphs' => ['Paragraphs', 'lines', 'One paragraph per line.'],
                'cta_label' => ['Link text', 'text', ''],
                'cta_href' => ['Link address', 'link', ''],
            ], $pairs('value', 'Value', 4)),
        ],
        'why' => [
            'title' => 'Homepage — Why ZOOM X',
            'fields' => array_merge([
                'eyebrow' => ['Small line above the heading', 'text', ''],
                'title' => ['Heading', 'text', ''],
            ], $pairs('item', 'Reason', 4)),
        ],
    ];
}

function zoomx_content_get(): array
{
    $saved = get_option(ZOOMX_CONTENT_OPTION, []);
    return is_array($saved) ? $saved : [];
}

/** Only site paths or http(s) URLs are accepted for links. */
function zoomx_content_sanitize_link(string $value): string
{
    $value = trim($value);
    if ($value === '') return '';
    if (preg_match('#^/(?!/)[^\s]*$#', $value)) return $value;
    $url = esc_url_raw($value, ['https', 'http']);
    return $url ?: '';
}

function zoomx_content_sanitize(array $input): array
{
    $clean = [];
    foreach (zoomx_content_schema() as $section => $def) {
        foreach ($def['fields'] as $field => [, $type]) {
            $raw = isset($input[$section][$field]) ? wp_unslash((string) $input[$section][$field]) : '';
            switch ($type) {
                case 'checkbox':
                    $value = $raw === '1' ? '1' : '';
                    break;
                case 'link':
                    $value = zoomx_content_sanitize_link($raw);
                    break;
                case 'lines':
                case 'textarea':
                    $value = sanitize_textarea_field($raw);
                    break;
                default:
                    $value = sanitize_text_field($raw);
            }
            if ($value !== '') $clean[$section][$field] = mb_substr($value, 0, 2000);
        }
    }
    return $clean;
}

/** Public JSON shape consumed by the storefront (empty fields omitted). */
function zoomx_content_public(): array
{
    $c = zoomx_content_get();
    $lines = fn($v) => array_values(array_filter(array_map('trim', preg_split('/\r?\n/', (string) $v))));
    $pairs = function (array $s, string $prefix) {
        $out = [];
        for ($i = 1; $i <= 4; $i++) {
            $t = $s["{$prefix}_{$i}_title"] ?? '';
            $b = $s["{$prefix}_{$i}_body"] ?? '';
            if ($t !== '' && $b !== '') $out[] = ['title' => $t, 'body' => $b];
        }
        return $out;
    };
    $link = fn($label, $href) => ($label !== '' && $href !== '') ? ['label' => $label, 'href' => $href] : null;

    $a = $c['announcement'] ?? [];
    $h = $c['hero'] ?? [];
    $b = $c['business'] ?? [];
    $s = $c['story'] ?? [];
    $w = $c['why'] ?? [];

    $data = [
        // false = hidden on purpose; null = use the storefront's standard text.
        'announcement' => !empty($a['hide'])
            ? false
            : (!empty($a['message'])
                ? array_filter(['message' => $a['message'], 'link' => $link($a['link_label'] ?? '', $a['link_href'] ?? '')])
                : null),
        'hero' => array_filter([
            'eyebrow' => $h['eyebrow'] ?? null,
            'title' => $h['title'] ?? null,
            'lead' => $h['lead'] ?? null,
            'primary' => $link($h['primary_label'] ?? '', $h['primary_href'] ?? ''),
            'secondary' => $link($h['secondary_label'] ?? '', $h['secondary_href'] ?? ''),
        ]),
        'business' => array_filter([
            'eyebrow' => $b['eyebrow'] ?? null,
            'title' => $b['title'] ?? null,
            'lead' => $b['lead'] ?? null,
            'points' => $lines($b['points'] ?? '') ?: null,
            'cta' => $link($b['cta_label'] ?? '', $b['cta_href'] ?? ''),
        ]),
        'story' => array_filter([
            'eyebrow' => $s['eyebrow'] ?? null,
            'title' => $s['title'] ?? null,
            'paragraphs' => $lines($s['paragraphs'] ?? '') ?: null,
            'values' => $pairs($s, 'value') ?: null,
            'cta' => $link($s['cta_label'] ?? '', $s['cta_href'] ?? ''),
        ]),
        'why' => array_filter([
            'eyebrow' => $w['eyebrow'] ?? null,
            'title' => $w['title'] ?? null,
            'items' => $pairs($w, 'item') ?: null,
        ]),
    ];
    return $data;
}

add_action('rest_api_init', function () {
    register_rest_route('zoomx/v1', '/content', [
        'methods' => 'GET',
        'permission_callback' => '__return_true', // public, read-only marketing copy
        'callback' => fn() => new WP_REST_Response(zoomx_content_public(), 200),
    ]);
});

/** Asks the storefront to drop its cached copy. Best-effort; never blocks saving. */
function zoomx_content_notify_storefront(): string
{
    $base = zoomx_storefront_url();
    $secret = zoomx_headless_secret();
    if (!$base || !$secret) return 'Saved. The website will pick up changes within an hour (storefront URL or secret not configured).';

    $body = wp_json_encode(['tags' => ['content']]);
    $ts = (string) time();
    $res = wp_remote_post($base . '/api/content/refresh', [
        'timeout' => 8,
        'headers' => [
            'Content-Type' => 'application/json',
            'X-ZoomX-Timestamp' => $ts,
            'X-ZoomX-Signature' => hash_hmac('sha256', $ts . '.' . $body, $secret),
        ],
        'body' => $body,
    ]);
    if (is_wp_error($res) || wp_remote_retrieve_response_code($res) !== 200) {
        return 'Saved, but the website could not be refreshed right now. It will update within an hour.';
    }
    return 'Saved. The website has been updated.';
}

add_action('admin_menu', function () {
    add_menu_page('ZOOM X site content', 'ZOOM X', 'manage_options', 'zoomx-content', 'zoomx_content_page', 'dashicons-store', 56);
    add_submenu_page('zoomx-content', 'Site content', 'Site content', 'manage_options', 'zoomx-content', 'zoomx_content_page');
});

function zoomx_content_page(): void
{
    if (!current_user_can('manage_options')) return;
    $notice = '';
    if (isset($_POST['zoomx_content']) && check_admin_referer('zoomx_content_save')) {
        update_option(ZOOMX_CONTENT_OPTION, zoomx_content_sanitize((array) $_POST['zoomx_content']), false);
        $notice = zoomx_content_notify_storefront();
    }
    $c = zoomx_content_get();
    ?>
    <div class="wrap">
        <h1>ZOOM X — Site content</h1>
        <p>Edit the text on the website. <strong>Leave a field empty to keep the website's standard text.</strong>
            Only publish claims the business can back up (no unverified certifications or percentages).</p>
        <?php if ($notice) : ?><div class="notice notice-success is-dismissible"><p><?php echo esc_html($notice); ?></p></div><?php endif; ?>
        <form method="post">
            <?php wp_nonce_field('zoomx_content_save'); ?>
            <?php foreach (zoomx_content_schema() as $section => $def) : ?>
                <h2 class="title" style="margin-top:2em"><?php echo esc_html($def['title']); ?></h2>
                <?php if (!empty($def['help'])) : ?><p class="description"><?php echo esc_html($def['help']); ?></p><?php endif; ?>
                <table class="form-table" role="presentation"><tbody>
                <?php foreach ($def['fields'] as $field => [$label, $type, $help]) :
                    $id = "zx-$section-$field";
                    $name = "zoomx_content[$section][$field]";
                    $value = $c[$section][$field] ?? ''; ?>
                    <tr>
                        <th scope="row"><label for="<?php echo esc_attr($id); ?>"><?php echo esc_html($label); ?></label></th>
                        <td>
                            <?php if ($type === 'checkbox') : ?>
                                <label><input id="<?php echo esc_attr($id); ?>" name="<?php echo esc_attr($name); ?>" type="checkbox" value="1" <?php checked($value, '1'); ?>> <?php echo esc_html($label); ?></label>
                            <?php elseif ($type === 'textarea' || $type === 'lines') : ?>
                                <textarea id="<?php echo esc_attr($id); ?>" name="<?php echo esc_attr($name); ?>" rows="<?php echo $type === 'lines' ? 4 : 2; ?>" class="large-text"><?php echo esc_textarea($value); ?></textarea>
                            <?php else : ?>
                                <input id="<?php echo esc_attr($id); ?>" name="<?php echo esc_attr($name); ?>" type="text" class="regular-text" value="<?php echo esc_attr($value); ?>">
                            <?php endif; ?>
                            <?php if ($help) : ?><p class="description"><?php echo esc_html($help); ?></p><?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody></table>
            <?php endforeach; ?>
            <?php submit_button('Save and update website'); ?>
        </form>
    </div>
    <?php
}
