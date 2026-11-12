<?php
/**
 * Editable content pages ("ZOOM X → Pages" in wp-admin): About,
 * Sustainability, For businesses, FAQs and the four policies.
 *
 * Body format (plain text, never HTML):
 *   "## Heading" starts a section, "- item" is a bullet point,
 *   a blank line separates paragraphs.
 *
 * The editor is pre-filled with the website's current text, fetched from
 * GET {storefront}/api/content/pages. Edits are served to the storefront at
 *   GET /wp-json/zoomx/v1/pages
 * and saving refreshes the site (see zoomx_content_notify_storefront()).
 */

defined('ABSPATH') || exit;

const ZOOMX_PAGES_OPTION = 'zoomx_page_content';

function zoomx_pages_list(): array
{
    return [
        'about' => 'About',
        'sustainability' => 'Sustainability',
        'for-businesses' => 'For businesses',
        'faqs' => 'FAQs',
        'delivery' => 'Delivery policy',
        'returns' => 'Returns & refunds policy',
        'privacy' => 'Privacy policy',
        'terms' => 'Terms & conditions',
    ];
}

function zoomx_pages_get(): array
{
    $saved = get_option(ZOOMX_PAGES_OPTION, []);
    return is_array($saved) ? $saved : [];
}

/** The website's built-in text for every page (cached for 10 minutes). */
function zoomx_pages_defaults(): array
{
    $cached = get_transient('zoomx_page_defaults');
    if (is_array($cached)) return $cached;
    $base = zoomx_storefront_url();
    if (!$base) return [];
    $res = wp_remote_get($base . '/api/content/pages', ['timeout' => 8]);
    if (is_wp_error($res) || wp_remote_retrieve_response_code($res) !== 200) return [];
    $data = json_decode(wp_remote_retrieve_body($res), true);
    if (!is_array($data)) return [];
    set_transient('zoomx_page_defaults', $data, 10 * MINUTE_IN_SECONDS);
    return $data;
}

function zoomx_pages_sanitize(array $in): array
{
    $out = [];
    foreach (['title' => 200, 'description' => 300, 'eyebrow' => 200, 'lead' => 300] as $key => $max) {
        $v = sanitize_text_field(wp_unslash((string) ($in[$key] ?? '')));
        if ($v !== '') $out[$key] = mb_substr($v, 0, $max);
    }
    $status = (string) ($in['status'] ?? '');
    if (in_array($status, ['draft', 'approved'], true)) $out['status'] = $status;
    $body = str_replace(["\r\n", "\r"], "\n", sanitize_textarea_field(wp_unslash((string) ($in['body'] ?? ''))));
    if (trim($body) !== '') $out['body'] = mb_substr($body, 0, 20000);
    return $out;
}

add_action('rest_api_init', function () {
    register_rest_route('zoomx/v1', '/pages', [
        'methods' => 'GET',
        'permission_callback' => '__return_true', // public, read-only page copy
        'callback' => fn() => new WP_REST_Response((object) zoomx_pages_get(), 200),
    ]);
});

add_action('admin_menu', function () {
    add_submenu_page('zoomx-content', 'Pages', 'Pages', 'manage_options', 'zoomx-pages', 'zoomx_pages_screen');
}, 20);

function zoomx_pages_screen(): void
{
    if (!current_user_can('manage_options')) return;
    $pages = zoomx_pages_list();
    $slug = isset($_GET['slug'], $pages[$_GET['slug']]) ? (string) $_GET['slug'] : 'about';
    $all = zoomx_pages_get();
    $notice = '';

    if (isset($_POST['zoomx_page']) && check_admin_referer('zoomx_page_save_' . $slug)) {
        if (!empty($_POST['zoomx_page_reset'])) {
            unset($all[$slug]);
            $notice = 'Restored the standard text. ';
        } else {
            $clean = zoomx_pages_sanitize((array) $_POST['zoomx_page']);
            // Store only what differs from the website's standard text, so
            // later improvements to the standard text still show through.
            $defaults = zoomx_pages_defaults()[$slug] ?? [];
            foreach ($clean as $k => $v) {
                $norm = fn($s) => trim(str_replace(["\r\n", "\r"], "\n", (string) $s));
                if (isset($defaults[$k]) && $norm($defaults[$k]) === $norm($v)) unset($clean[$k]);
            }
            if ($clean) $all[$slug] = $clean; else unset($all[$slug]);
        }
        update_option(ZOOMX_PAGES_OPTION, $all, false);
        $notice .= zoomx_content_notify_storefront();
    }

    $defaults = zoomx_pages_defaults()[$slug] ?? [];
    $saved = $all[$slug] ?? [];
    $value = fn($k) => $saved[$k] ?? ($defaults[$k] ?? '');
    $status = $value('status') ?: 'draft';
    ?>
    <div class="wrap">
        <h1>ZOOM X — Pages</h1>
        <?php if ($notice) : ?><div class="notice notice-success is-dismissible"><p><?php echo esc_html($notice); ?></p></div><?php endif; ?>
        <?php if (!$defaults) : ?>
            <div class="notice notice-warning"><p>Could not load the website's current text, so empty boxes keep the standard wording. Check the storefront URL setting.</p></div>
        <?php endif; ?>

        <nav class="nav-tab-wrapper" aria-label="Choose a page">
            <?php foreach ($pages as $s => $label) : ?>
                <a class="nav-tab <?php echo $s === $slug ? 'nav-tab-active' : ''; ?>" href="<?php echo esc_url(admin_url('admin.php?page=zoomx-pages&slug=' . $s)); ?>"><?php echo esc_html($label); ?></a>
            <?php endforeach; ?>
        </nav>

        <form method="post" style="max-width:60rem">
            <?php wp_nonce_field('zoomx_page_save_' . $slug); ?>
            <p class="description" style="margin-top:1em">
                <?php echo $saved ? 'This page has your edits.' : 'This page shows the standard website text.'; ?>
                Only publish what the business can confirm. Replace any [bracketed] notes before approving.
            </p>
            <table class="form-table" role="presentation"><tbody>
                <tr><th scope="row"><label for="zx-p-title">Page title</label></th>
                    <td><input id="zx-p-title" name="zoomx_page[title]" class="regular-text" value="<?php echo esc_attr($value('title')); ?>">
                    <p class="description">Shown in the browser tab, search results and breadcrumbs.</p></td></tr>
                <tr><th scope="row"><label for="zx-p-desc">Search description</label></th>
                    <td><input id="zx-p-desc" name="zoomx_page[description]" class="large-text" value="<?php echo esc_attr($value('description')); ?>"></td></tr>
                <tr><th scope="row"><label for="zx-p-eyebrow">Small line above the headline</label></th>
                    <td><input id="zx-p-eyebrow" name="zoomx_page[eyebrow]" class="regular-text" value="<?php echo esc_attr($value('eyebrow')); ?>"></td></tr>
                <tr><th scope="row"><label for="zx-p-lead">Headline</label></th>
                    <td><input id="zx-p-lead" name="zoomx_page[lead]" class="large-text" value="<?php echo esc_attr($value('lead')); ?>"></td></tr>
                <tr><th scope="row"><label for="zx-p-status">Status</label></th>
                    <td><select id="zx-p-status" name="zoomx_page[status]">
                        <option value="draft" <?php selected($status, 'draft'); ?>>Draft — shows a "Draft" notice, hidden from Google</option>
                        <option value="approved" <?php selected($status, 'approved'); ?>>Approved — published normally</option>
                    </select></td></tr>
                <tr><th scope="row"><label for="zx-p-body">Page text</label></th>
                    <td><textarea id="zx-p-body" name="zoomx_page[body]" rows="22" class="large-text code"><?php echo esc_textarea($value('body')); ?></textarea>
                    <p class="description"><code>## Heading</code> starts a section · <code>- text</code> makes a bullet point · leave a blank line between paragraphs.</p></td></tr>
            </tbody></table>
            <p class="submit">
                <?php submit_button('Save and update website', 'primary', 'submit', false); ?>
                <?php if ($saved) : ?>
                    <button type="submit" name="zoomx_page_reset" value="1" class="button" onclick="return confirm('Remove your edits to this page and use the standard text?');">Restore standard text</button>
                <?php endif; ?>
            </p>
        </form>
    </div>
    <?php
}
