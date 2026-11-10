<?php
/**
 * Plugin Name: ZOOM X Headless Payments
 * Description: Registers payment methods whose payment step is run by the ZOOM X Next.js storefront (e.g. PayHere). WooCommerce creates the order as "Pending payment"; the storefront redirects the customer to the gateway and marks the order paid only after verifying the gateway's signed server notification.
 * Version: 1.0.0
 * Requires Plugins: woocommerce
 * Author: ZOOM X
 * License: GPL-2.0-or-later
 *
 * Why this exists: the storefront is headless, so the customer never sees
 * WooCommerce's own checkout pages. PayHere's official plugin performs the
 * payment on WordPress pages instead. This gateway only lets the Store API
 * accept the method and leaves the order pending — it holds no credentials
 * and never marks anything paid.
 */

defined('ABSPATH') || exit;

add_action('plugins_loaded', function () {
    if (!class_exists('WC_Payment_Gateway')) {
        return;
    }

    class ZoomX_Headless_PayHere_Gateway extends WC_Payment_Gateway
    {
        public function __construct()
        {
            // Distinct from the official plugin's "payhere" id so both can coexist.
            $this->id = 'zoomx_payhere';
            $this->method_title = 'PayHere (headless storefront)';
            $this->method_description = 'Card and mobile-wallet payments via PayHere, completed by the ZOOM X storefront. Credentials are configured on the storefront (Vercel), not here.';
            $this->has_fields = false;
            $this->supports = ['products'];

            $this->init_form_fields();
            $this->init_settings();
            $this->title = $this->get_option('title', 'Card or mobile wallet (PayHere)');
            $this->description = $this->get_option('description', '');
            $this->enabled = $this->get_option('enabled', 'no');

            add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);
        }

        public function init_form_fields()
        {
            $this->form_fields = [
                'enabled' => ['title' => 'Enable', 'type' => 'checkbox', 'label' => 'Offer PayHere on the storefront', 'default' => 'no'],
                'title' => ['title' => 'Title', 'type' => 'text', 'default' => 'Card or mobile wallet (PayHere)'],
                'description' => ['title' => 'Description', 'type' => 'textarea', 'default' => ''],
            ];
        }

        public function process_payment($order_id)
        {
            $order = wc_get_order($order_id);
            // Stock is reduced/held by WooCommerce per its "Hold stock" setting.
            $order->update_status('pending', 'Awaiting PayHere payment via the storefront.');
            // No redirect: the storefront sends the customer to PayHere itself.
            return ['result' => 'success', 'redirect' => ''];
        }
    }

    add_filter('woocommerce_payment_gateways', function ($gateways) {
        $gateways[] = 'ZoomX_Headless_PayHere_Gateway';
        return $gateways;
    });
});
