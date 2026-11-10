<?php
/**
 * ZOOM X local sandbox seed — PLACEHOLDER DATA ONLY.
 *
 * Every product, price, SKU and stock level here is invented to exercise the
 * storefront (simple / variable / sale / out-of-stock / multi-category).
 * None of it is Zoom X business data. Names are prefixed "Sandbox".
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

// Shipping: one island-wide zone with a sandbox flat rate.
$zone = new WC_Shipping_Zone();
$zone->set_zone_name('Sandbox — Sri Lanka');
$zone->add_location('LK', 'country');
$zone->save();
$instance = $zone->add_shipping_method('flat_rate');
update_option("woocommerce_flat_rate_{$instance}_settings", [
    'title' => 'Sandbox flat rate', 'tax_status' => 'none', 'cost' => '350',
]);

// Categories.
$cats = [];
foreach ([
    'sandbox-kitchen' => ['Sandbox Kitchen', 'Placeholder category for kitchen products.'],
    'sandbox-laundry' => ['Sandbox Laundry', 'Placeholder category for laundry products.'],
    'sandbox-surfaces' => ['Sandbox Surfaces', 'Placeholder category for surface cleaners.'],
] as $slug => [$name, $desc]) {
    $term = wp_insert_term($name, 'product_cat', ['slug' => $slug, 'description' => $desc]);
    $cats[$slug] = is_wp_error($term) ? (int) $term->get_error_data() : $term['term_id'];
}

function zx_simple(array $a, array $cats): int {
    $p = new WC_Product_Simple();
    $p->set_name($a['name']);
    $p->set_slug($a['slug']);
    $p->set_sku($a['sku']);
    $p->set_regular_price($a['price']);
    if (!empty($a['sale'])) $p->set_sale_price($a['sale']);
    $p->set_manage_stock(true);
    $p->set_stock_quantity($a['stock']);
    $p->set_stock_status($a['stock'] > 0 ? 'instock' : 'outofstock');
    $p->set_short_description('Sandbox placeholder product. Not real Zoom X data.');
    $p->set_description('<p>This is invented test content for the local development sandbox.</p>');
    $p->set_category_ids(array_map(fn($s) => $cats[$s], $a['cats']));
    $p->set_featured(!empty($a['featured']));
    $p->set_weight('1');
    if (!empty($a['sales'])) $p->set_total_sales($a['sales']);
    return $p->save();
}

zx_simple(['name' => 'Sandbox Dish Liquid', 'slug' => 'sandbox-dish-liquid', 'sku' => 'SBX-DISH-500',
    'price' => '650', 'stock' => 40, 'cats' => ['sandbox-kitchen'], 'featured' => true, 'sales' => 120], $cats);
zx_simple(['name' => 'Sandbox Floor Cleaner', 'slug' => 'sandbox-floor-cleaner', 'sku' => 'SBX-FLOOR-1L',
    'price' => '890', 'sale' => '750', 'stock' => 25, 'cats' => ['sandbox-surfaces'], 'sales' => 80], $cats);
zx_simple(['name' => 'Sandbox Glass Cleaner', 'slug' => 'sandbox-glass-cleaner', 'sku' => 'SBX-GLASS-500',
    'price' => '540', 'stock' => 0, 'cats' => ['sandbox-surfaces']], $cats);
zx_simple(['name' => 'Sandbox Fabric Softener', 'slug' => 'sandbox-fabric-softener', 'sku' => 'SBX-SOFT-1L',
    'price' => '980', 'stock' => 15, 'cats' => ['sandbox-laundry'], 'featured' => true, 'sales' => 45], $cats);
zx_simple(['name' => 'Sandbox Multi-Purpose Spray', 'slug' => 'sandbox-multi-purpose-spray', 'sku' => 'SBX-MULTI-500',
    'price' => '720', 'stock' => 3, 'cats' => ['sandbox-kitchen', 'sandbox-surfaces'], 'sales' => 200], $cats);

// Variable product: sizes, one variation out of stock, one on sale.
$attr = new WC_Product_Attribute();
$attr->set_name('Size');
$attr->set_options(['500 ml', '1 L', '2 L']);
$attr->set_visible(true);
$attr->set_variation(true);

$var = new WC_Product_Variable();
$var->set_name('Sandbox Laundry Liquid');
$var->set_slug('sandbox-laundry-liquid');
$var->set_sku('SBX-LAUNDRY');
$var->set_short_description('Sandbox placeholder variable product. Not real Zoom X data.');
$var->set_description('<p>Invented test content with three sizes.</p>');
$var->set_category_ids([$cats['sandbox-laundry']]);
$var->set_attributes([$attr]);
$var->set_featured(true);
$var->set_total_sales(150);
$parent = $var->save();

foreach ([
    ['500 ml', 'SBX-LAUNDRY-500', '700', '', 30],
    ['1 L', 'SBX-LAUNDRY-1L', '1250', '1100', 20],
    ['2 L', 'SBX-LAUNDRY-2L', '2300', '', 0],
] as [$size, $sku, $price, $sale, $stock]) {
    $v = new WC_Product_Variation();
    $v->set_parent_id($parent);
    $v->set_attributes(['size' => $size]);
    $v->set_sku($sku);
    $v->set_regular_price($price);
    if ($sale) $v->set_sale_price($sale);
    $v->set_manage_stock(true);
    $v->set_stock_quantity($stock);
    $v->set_stock_status($stock > 0 ? 'instock' : 'outofstock');
    $v->set_weight('1');
    $v->save();
}
WC_Product_Variable::sync($parent);

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

flush_rewrite_rules();
update_option('zoomx_sandbox_seeded', 1);
echo "ZOOM X sandbox seeded\n";
