<?php
/**
 * PHPUnit bootstrap for QuickPostr unit tests.
 *
 * These are fast, isolated unit tests that mock WordPress functions with
 * Brain Monkey — no WordPress install or database required. Integration tests
 * that need a real WP runtime (WP_UnitTestCase) live in tests/phpunit/integration
 * and use integration-bootstrap.php instead.
 *
 * @package QuickPostr
 */

require_once dirname( __DIR__, 2 ) . '/vendor/autoload.php';

// The plugin class files guard on ABSPATH; define a dummy so they load under
// PHPUnit without a WordPress runtime.
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', dirname( __DIR__, 2 ) . '/' );
}

require_once dirname( __DIR__, 2 ) . '/includes/class-quickpostr.php';
require_once dirname( __DIR__, 2 ) . '/includes/class-settings.php';
require_once dirname( __DIR__, 2 ) . '/includes/class-rest.php';
require_once dirname( __DIR__, 2 ) . '/includes/class-manifest.php';
require_once dirname( __DIR__, 2 ) . '/includes/class-privacy.php';
