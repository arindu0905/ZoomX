<?php
/**
 * ZOOM X local sandbox seed.
 *
 * Products, categories, copy and images are the real ZOOM X range from
 * zoomx.lk (sandbox/catalogue/products.json). PRICES, SKUs (SBX-…) AND STOCK
 * ARE SANDBOX PLACEHOLDERS — zoomx.lk publishes none — invented only to
 * exercise sale / low-stock / out-of-stock / variable states in tests.
 * Shipping rate and the SANDBOX10 coupon are placeholders too.
 */
require_once '/wordpress/wp-load.php';

if (get_option('zoomx_sandbox_seeded')) {
    return;
}

// Store settings: Sri Lanka, LKR.
update_option('woocommerce_default_country', 'LK');
update_option('woocommerce_currency', 'LKR');
update_option('woocommerce_price_num_decimals', '2');
update_option('woocommerce_allowed_countries', 'specific');
update_option('woocommerce_specific_allowed_countries', ['LK']);
update_option('woocommerce_ship_to_countries', '');
update_option('woocommerce_calc_taxes', 'no');
update_option('woocommerce_enable_coupons', 'yes');
update_option('woocommerce_enable_guest_checkout', 'yes');
update_option('woocommerce_enable_myaccount_registration', 'yes');
update_option('zoomx_storefront_url', 'http://localhost:3000');
update_option('woocommerce_coming_soon', 'no');
update_option('permalink_structure', '/%postname%/');

// Cash on Delivery on.
update_option('woocommerce_cod_settings', [
    'enabled' => 'yes',
    'title' => 'Cash on delivery',
    'description' => 'Pay with cash upon delivery.',
    'instructions' => '',
    'enable_for_methods' => [],
    'enable_for_virtual' => 'yes',
]);

// Headless PayHere method (wordpress-plugin/zoomx-headless-payments) enabled.
update_option('woocommerce_zoomx_payhere_settings', ['enabled' => 'yes', 'title' => 'Card or mobile wallet (PayHere)', 'description' => '']);

// Shipping: one island-wide zone with a sandbox flat rate.
$zone = new WC_Shipping_Zone();
$zone->set_zone_name('Sandbox — Sri Lanka');
$zone->add_location('LK', 'country');
$zone->save();
$instance = $zone->add_shipping_method('flat_rate');
update_option("woocommerce_flat_rate_{$instance}_settings", [
    'title' => 'Sandbox flat rate', 'tax_status' => 'none', 'cost' => '350',
]);
// Free delivery from LKR 5,000 — keep in step with NEXT_PUBLIC_FREE_DELIVERY_FROM
// (the storefront's free-delivery progress bar).
$free = $zone->add_shipping_method('free_shipping');
update_option("woocommerce_free_shipping_{$free}_settings", [
    'title' => 'Free delivery', 'requires' => 'min_amount', 'min_amount' => '5000', 'ignore_discounts' => 'no',
]);

// ── Catalogue ────────────────────────────────────────────────────────────
// Real ZOOM X range from zoomx.lk (sandbox/catalogue/products.json): names,
// sizes, copy and packshots. zoomx.lk publishes no prices, SKUs or stock, so
// $commerce below is SANDBOX-ONLY placeholder data that exists purely to
// exercise cart, checkout and stock states. Never import it into the real
// store — use the generated WooCommerce CSV (scripts/catalogue-csv.mjs),
// which leaves prices blank for the business to fill in.
require_once ABSPATH . 'wp-admin/includes/image.php';

$catalogue = json_decode(file_get_contents('/zoomx-sandbox/catalogue/products.json'), true);

$cats = [];
foreach ($catalogue['categories'] as $c) {
    $term = wp_insert_term($c['name'], 'product_cat', ['slug' => $c['slug'], 'description' => $c['description']]);
    $cats[$c['slug']] = is_wp_error($term) ? (int) $term->get_error_data() : $term['term_id'];
}

/** Copies a catalogue image into the media library; returns the attachment id. */
function zx_image(string $file, string $alt): int {
    static $done = [];
    if (isset($done[$file])) return $done[$file];
    $uploads = wp_upload_dir();
    $dest = trailingslashit($uploads['path']) . $file;
    copy('/zoomx-sandbox/catalogue/images/' . $file, $dest);
    $id = wp_insert_attachment([
        'post_mime_type' => 'image/webp',
        'post_title' => $alt,
        'post_status' => 'inherit',
    ], $dest);
    wp_update_attachment_metadata($id, wp_generate_attachment_metadata($id, $dest));
    update_post_meta($id, '_wp_attachment_image_alt', $alt);
    return $done[$file] = $id;
}

function zx_description(array $p): string {
    $html = '<p>' . esc_html($p['tagline']) . '.</p>';
    $html .= '<p>Key features:</p><ul>';
    foreach ($p['features'] as $f) $html .= '<li>' . esc_html($f) . '</li>';
    $html .= '</ul><p>Ideal for: ' . esc_html($p['idealFor']) . '.</p>';
    $html .= '<p>' . esc_html($p['safety']) . '</p>';
    return $html;
}

function zx_size_attribute(string $size): WC_Product_Attribute {
    $a = new WC_Product_Attribute();
    $a->set_name('Size');
    $a->set_options([$size]);
    $a->set_visible(true);
    $a->set_variation(false);
    return $a;
}

// SANDBOX-ONLY commerce fixtures: [sku, regular, sale, stock, total_sales].
// Chosen to cover sale, low-stock and out-of-stock states for the e2e suite.
$commerce = [
    'dish-washing-liquid'     => ['SBX-DISH-550',  '650', '',    40, 120],
    'laundry-detergent'       => ['SBX-LAUN-550',  '890', '',    30, 150],
    'fabric-conditioner'      => ['SBX-FABC-550',  '820', '',    20, 90],
    'all-purpose-all-surface' => ['SBX-APAS-550',  '720', '',    3,  200],
    'general-purpose-cleaner' => ['SBX-GPC-550',   '690', '590', 25, 80],
    'glass-cleaner'           => ['SBX-GLAS-550',  '640', '',    15, 60],
    'tile-cleaner'            => ['SBX-TILE-550',  '760', '',    0,  40],
    'toilet-bowl-cleaner'     => ['SBX-TOIL-550',  '780', '',    22, 70],
    'hand-wash'               => ['SBX-HAND-550',  '560', '',    35, 110],
];
// Variable product: [sku, regular, sale, stock] per option.
$variationCommerce = [
    'Cinnamon'    => ['SBX-AIR-CIN-550', '750', '',    18],
    'Green Apple' => ['SBX-AIR-GAP-550', '750', '650', 0],
];

foreach ($catalogue['products'] as $p) {
    $gallery = array_map(fn($f) => zx_image($f, $p['name'] . ' ' . $p['size']), $p['images']);
    // Category thumbnail = packshot of the first product listed in it.
    if (!get_term_meta($cats[$p['category']], 'thumbnail_id', true)) {
        update_term_meta($cats[$p['category']], 'thumbnail_id', $gallery[0]);
    }
    $product = empty($p['variations']) ? new WC_Product_Simple() : new WC_Product_Variable();
    $product->set_name($p['name']);
    $product->set_slug($p['slug']);
    $product->set_short_description('<p>' . esc_html($p['size']) . ' · ' . esc_html($p['features'][0]) . '.</p>');
    $product->set_description(zx_description($p));
    $product->set_category_ids([$cats[$p['category']]]);
    $product->set_featured(!empty($p['featured']));
    $product->set_image_id($gallery[0]);
    $product->set_gallery_image_ids(array_slice($gallery, 1));

    if (empty($p['variations'])) {
        [$sku, $regular, $sale, $stock, $sales] = $commerce[$p['slug']];
        $product->set_sku($sku);
        $product->set_regular_price($regular);
        if ($sale) $product->set_sale_price($sale);
        $product->set_manage_stock(true);
        $product->set_stock_quantity($stock);
        $product->set_stock_status($stock > 0 ? 'instock' : 'outofstock');
        $product->set_total_sales($sales);
        $product->set_attributes([zx_size_attribute($p['size'])]);
        $product->save();
        continue;
    }

    $v = $p['variations'];
    $attr = new WC_Product_Attribute();
    $attr->set_name($v['attribute']);
    $attr->set_options(array_column($v['options'], 'value'));
    $attr->set_visible(true);
    $attr->set_variation(true);
    $product->set_sku('SBX-AIR');
    $product->set_attributes([zx_size_attribute($p['size']), $attr]);
    $product->set_total_sales(95);
    $parent = $product->save();

    foreach ($v['options'] as $o) {
        [$sku, $regular, $sale, $stock] = $variationCommerce[$o['value']];
        $var = new WC_Product_Variation();
        $var->set_parent_id($parent);
        $var->set_attributes([sanitize_title($v['attribute']) => $o['value']]);
        $var->set_sku($sku);
        $var->set_regular_price($regular);
        if ($sale) $var->set_sale_price($sale);
        $var->set_manage_stock(true);
        $var->set_stock_quantity($stock);
        $var->set_stock_status($stock > 0 ? 'instock' : 'outofstock');
        $var->set_image_id(zx_image($o['image'], $p['name'] . ' ' . $o['value']));
        $var->save();
    }
    WC_Product_Variable::sync($parent);
}

// Test coupon.
$c = new WC_Coupon();
$c->set_code('SANDBOX10');
$c->set_discount_type('percent');
$c->set_amount(10);
$c->save();

// ── REST API v3 key for server-side calls (order lookup, accounts) ──────
// Generated on the host by scripts/sandbox-keys.mjs (npm run sandbox) into
// sandbox/.rest-keys.env (git-ignored). Read-only here: nothing secret is
// written into the web root. Sandbox-only values.
$env = @parse_ini_file("/zoomx-sandbox/.rest-keys.env") ?: [];
$ck = $env["WOOCOMMERCE_CONSUMER_KEY"] ?? null;
$cs = $env["WOOCOMMERCE_CONSUMER_SECRET"] ?? null;
if (!empty($env["WORDPRESS_AUTH_SECRET"])) {
    update_option('zoomx_headless_secret', $env["WORDPRESS_AUTH_SECRET"]);
}
if ($ck && $cs) {
global $wpdb;
$wpdb->insert($wpdb->prefix . 'woocommerce_api_keys', [
    'user_id' => 1,
    'description' => 'ZOOM X storefront (sandbox)',
    'permissions' => 'read_write',
    'consumer_key' => wc_api_hash($ck),
    'consumer_secret' => $cs,
    'truncated_key' => substr($ck, -7),
]);
}

// WooCommerce only accepts Basic auth over HTTPS. The sandbox is plain HTTP
// on localhost, so treat REST requests as secure here. NEVER do this on a
// real site — production must be served over HTTPS.
@mkdir('/wordpress/wp-content/mu-plugins', 0777, true);
file_put_contents('/wordpress/wp-content/mu-plugins/zoomx-sandbox-rest-auth.php', <<<'PHP'
<?php
/* ZOOM X local sandbox only: allow REST Basic auth over http://127.0.0.1. */
if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/wp-json/wc/v3/') !== false) {
    $_SERVER['HTTPS'] = 'on';
}
PHP);

// In the WordPress Playground build of WooCommerce 11.2 (SQLite), the
// "hold stock during checkout" reservation rejects every stock-managed
// product with "Not enough units… available". Skip only that reservation in
// the sandbox; stock is still validated and reduced when the order is placed.
// Sandbox only — never on a real store.
file_put_contents('/wordpress/wp-content/mu-plugins/zoomx-sandbox-stock-hold.php', <<<'PHP'
<?php
/* ZOOM X local sandbox only: work around Playground/SQLite stock reservation. */
add_filter('woocommerce_hold_stock_for_checkout', '__return_false');
PHP);

flush_rewrite_rules();
update_option('zoomx_sandbox_seeded', 1);
echo "ZOOM X sandbox seeded\n";
