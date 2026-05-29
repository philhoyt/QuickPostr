<?php
/**
 * PHPStan analysis bootstrap.
 *
 * Declares the runtime constants defined in quickpostr.php whose values are
 * function calls (plugin_dir_path/plugin_dir_url), which PHPStan cannot evaluate
 * statically. Dev-only — not shipped in the plugin zip.
 *
 * @package QuickPostr
 */

define( 'QUICKPOSTR_VERSION', '0.0.0' );
// Real project root so require()'d build asset manifests resolve during analysis.
define( 'QUICKPOSTR_PATH', dirname( __DIR__ ) . '/' );
define( 'QUICKPOSTR_URL', 'https://example.com/' );
