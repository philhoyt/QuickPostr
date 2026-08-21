<?php
/**
 * Block pattern: Composer + post feed.
 *
 * Returns the serialized block markup for the quickpostr/post-feed pattern.
 * Kept as a file rather than an inline string so the markup stays readable and
 * can be pasted into the editor for testing.
 *
 * Plugins do not get the automatic patterns/ directory registration that block
 * themes do, so this file is require'd by QuickPostr::register_block_patterns()
 * and its return value handed to register_block_pattern().
 *
 * @package QuickPostr
 *
 * @var bool $quickpostr_has_geo Whether GeoTagr is active, set by the caller.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/*
 * The location line is only meaningful when GeoTagr is installed — without it
 * the block type is unregistered and the editor renders an error inside the
 * pattern, which reads as QuickPostr being broken.
 */
$quickpostr_location_block = $quickpostr_has_geo
	? '<!-- wp:geotagr/location-name {"style":{"elements":{"link":{"color":{"text":"var:preset|color|accent-4"}}},"typography":{"fontSize":"0.6rem"}},"textColor":"accent-4"} /-->'
	: '';

return <<<HTML
<!-- wp:quickpostr/composer /-->

<!-- wp:query {"queryId":0,"query":{"perPage":10,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false,"taxQuery":null,"parents":[],"excludeCurrent":null},"align":"full","layout":{"type":"default"}} -->
<div class="wp-block-query alignfull"><!-- wp:post-template {"align":"full","layout":{"type":"default"}} -->
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
<div class="wp-block-group"><!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:avatar {"size":32} /-->

<!-- wp:group {"style":{"spacing":{"blockGap":"0"}},"layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-group"><!-- wp:post-date {"format":"F j, Y"} /-->

{$quickpostr_location_block}</div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:quickpostr/post-actions /--></div>
<!-- /wp:group -->

<!-- wp:post-featured-image {"aspectRatio":"auto"} /-->

<!-- wp:post-title {"isLink":true,"fontSize":"x-large"} /-->

<!-- wp:post-content {"metadata":{"ignoredHookedBlocks":["activitypub/reactions"]},"align":"full","fontSize":"medium","layout":{"type":"constrained"}} /-->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
<div class="wp-block-group"><!-- wp:quickpostr/like-post /-->

<!-- wp:quickpostr/share-post /--></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
<!-- /wp:post-template -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:query-no-results -->
<!-- wp:paragraph -->
<p>Sorry, but nothing was found. Please try a search with different keywords.</p>
<!-- /wp:paragraph -->
<!-- /wp:query-no-results --></div>
<!-- /wp:group -->

<!-- wp:group {"align":"wide","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide"><!-- wp:query-pagination {"paginationArrow":"arrow","align":"wide","layout":{"type":"flex","justifyContent":"space-between"}} -->
<!-- wp:query-pagination-previous /-->

<!-- wp:query-pagination-numbers /-->

<!-- wp:query-pagination-next /-->
<!-- /wp:query-pagination --></div>
<!-- /wp:group --></div>
<!-- /wp:query -->
HTML;
