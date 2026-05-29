=== QuickPostr ===
Contributors: philhoyt
Tags: composer, post, social, front-end, gutenberg
Requires at least: 6.7
Tested up to: 7.0
Requires PHP: 8.1
Stable tag: 0.15.1
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Front-end post composer that lets logged-in users post status updates, photos, videos, and links without visiting wp-admin

== Description ==

Place the QuickPostr Composer block on any page. Logged-in users with the appropriate role see a composer with four modes:

* **Status** -- Rich text editor with bold, italic, and inline links. Drafts auto-save every 800 ms.
* **Photo** -- Drag-and-drop upload or WordPress media library picker. Optional caption. Selecting multiple images posts a gallery, which can be reordered before submitting.
* **Video** -- Drag-and-drop video upload. Embeds the uploaded video as a WordPress video block in the post content.
* **Link** -- Paste a URL to fetch Open Graph metadata and post a rich link card. Requires the [Better Bookmarks](https://github.com/philhoyt/BetterBookmarks) plugin for card display; falls back to a plain linked paragraph without it.

The composer is auth-gated server-side. Logged-out visitors see nothing.

Post titles are generated server-side from content. Titles are suppressed on the front end but remain visible in wp-admin and REST responses for ActivityPub and feed readers.

**Additional blocks**

* **Post Actions** -- a kebab menu with Edit and Delete actions for the current post. Edit opens the post in the WordPress editor. Place inside a Query Loop template.
* **Like Post** -- a heart button that lets visitors like a post and shows the like count. Place inside a Query Loop template.
* **Share Post** -- calls `navigator.share()`. Requires HTTPS; hides itself on HTTP or when the API is unavailable.

A **QuickPostr Slider** block style is also registered for `core/gallery`, turning a gallery into a scroll-snap slider with dot navigation, arrows, and swipe gestures.

**Requirements**

* A theme that declares `add_theme_support( 'post-formats', [...] )`
* PHP Imagick extension -- only required for EXIF stripping

== Installation ==

1. Upload the `quickpostr` directory to `/wp-content/plugins/`.
2. Activate the plugin via **Plugins → Installed Plugins**.
3. Place the **QuickPostr Composer** block on any page using the block editor.
4. Configure access and behaviour at **Settings → QuickPostr**.

== Configuration ==

All settings are at **Settings → QuickPostr**.

* **Allowed Roles** -- which roles can see and use the Composer block. Default: administrator, editor, author.
* **Default Post Status** -- publish or draft. Set to draft to queue posts for review.
* **Default Category** -- applied to every new post.
* **Show Slug Preview** -- displays the auto-generated title preview below the editor.
* **Hide Admin Bar** -- hides the WordPress admin bar for non-administrator roles.
* **Hide Admin Bar (Administrators)** -- separate toggle for the administrator role.
* **Front-End Post Management** -- enables the Edit and Delete actions in the Post Actions block.
* **Strip Photo Metadata** -- strips EXIF data (GPS, camera info) from JPEG uploads. Applies EXIF orientation to pixel data before stripping so images display correctly. Silently skipped if Imagick is unavailable.

Settings are stored in a single `wp_options` row under `quickpostr_settings`.

== Frequently Asked Questions ==

= Does the composer work for logged-out users? =

No. The block renders nothing for logged-out visitors. There is no fallback UI or login prompt.

= How are post titles generated? =

PHP generates the canonical title in `rest_after_insert_post`. The composer sends an empty title and the server overwrites it. Content under 55 characters becomes the title as-is. Longer content is truncated at the last word break before 55 characters and suffixed with an ellipsis. Posts with no text content (photo or link without a caption) get a dated fallback: "Photo — Jan 15, 2026".

= What authentication method is used? =

Cookie authentication with an `X-WP-Nonce` header. No Application Passwords. The nonce is injected server-side in `render.php` before the view script runs.

= How do I query only QuickPostr posts? =

QuickPostr registers a private `quickpostr_source` taxonomy. Each post receives the terms `app` and one of `status`, `photo`, `video`, or `link`. Use `tax_query` to filter:

    $query = new WP_Query( [
        'tax_query' => [ [
            'taxonomy' => 'quickpostr_source',
            'field'    => 'slug',
            'terms'    => 'app',
        ] ],
    ] );

= Does the Share Post block work on desktop? =

`navigator.share()` is not available in most desktop browsers. The block hides itself when the API is absent and requires HTTPS to function.

= Does EXIF stripping work for all image types? =

Only JPEG. PNG and WebP uploads are not processed.

== Changelog ==

= 0.15.1 =
* Fix: Gallery slider swipes now advance one photo at a time. A fast flick no longer skips past the photos in between by overshooting from the first slide to the last.

= 0.15.0 =
* Change: Editing a post from the front end now opens the WordPress editor instead of an inline composer. The front-end composer is used only for creating posts.

= 0.14.0 =
* Add: VideoMuxr companion plugin support — when VideoMuxr is active, video uploads route directly to Mux for transcoding and CDN-hosted playback, and it appears in the Companion Plugins settings section.
* Change: Single photos are now saved as an image block in the post content instead of a featured image, consistent with the other post formats. Existing photo posts are unaffected.
* Security: Anonymous likes are deduplicated by IP address to prevent like-count inflation.
* Change: Front-end strings in the like, share, and gallery-slider features are now translatable.
* Change: Minor composer UI polish and tested up to WordPress 7.0.

= 0.13.4 =
* Fix: Gallery slider images are now vertically centered — overrides WordPress block layout styles that were preventing consistent slide heights and image centering.

= 0.13.3 =
* Fix: block.json version strings now correctly match the plugin version for proper asset cache busting.

= 0.13.2 =
* Fix: Location chip now wraps long place names instead of overflowing the composer.
* Fix: Gallery photo preview is now vertically centered within the preview area.

= 0.13.1 =
* Fix: Location search now works correctly on hosted servers — user GPS coordinates are passed as a location bias to the Places API, preventing server IP location from skewing results.
* Fix: Forward geocode now returns up to 5 results when using the Google provider.

= 0.13.0 =
* Add: Geo-tagged posts now retain their location when published from a draft — coordinates and place name are saved correctly on publish.
* Add: Location chip now supports typing a custom place name directly, without having to pick a search result.
* Add: Location chip shows an "Add a name…" placeholder when coordinates are attached but no place name has been set.

= 0.12.2 =
* Fix: Location chip now has a Change button so users can correct a wrong auto-detected address without dismissing and starting over.

= 0.12.1 =
* Fix: Block stylesheet now cache-busts correctly after updates — location chip and gallery reorder styles now load on first visit after an upgrade.

= 0.12.0 =
* Add: Photos in the gallery composer can now be reordered before submitting using drag-and-drop or ← / → buttons.
* Add: Settings page now shows a GeoTagr companion plugin notice with an install link when GeoTagr is not active.

= 0.11.0 =
* Add: Location tagging in the composer. When the GeoTagr companion plugin is active, a Location button appears in the composer toolbar. Tap to auto-detect via the browser Geolocation API, or enter an address manually. The four GeoTagr meta keys are saved on the post on submit.
* Fix: Address search uses GeoTagr's configured geocoding provider (Google, Nominatim, or Mapbox) rather than always calling Nominatim.
* Fix: Location chip no longer overflows the composer container.

= 0.10.2 =
* Fix: Portrait videos uploaded from mobile now render with the correct aspect-ratio on the front end.

= 0.10.1 =
* Fix: Editing a photo post with multiple images now updates the existing post instead of creating a duplicate.

= 0.10.0 =
* Add: Video composer now includes a "choose from library" option, matching the photo composer.
* Fix: Photo post editing pre-fills the existing image and caption; the image can be replaced or the caption updated without re-uploading.
* Fix: Editing video, gallery, or link posts now navigates directly to the WordPress editor instead of attempting to parse block content.

= 0.9.1 =
* Fix: Resolve semi-transparent overlay on Chrome Android after uploading a video.

= 0.9.0 =
* Add: Like Post block with heart toggle and live like count for logged-in and logged-out visitors.
* Add: Scroll-snap gallery slider for core/gallery blocks via QuickPostr Slider block style.
* Add: Photo composer supports selecting multiple images from the media library at once.
* Change: Replace Edit Post and Delete Post blocks with a unified Post Actions kebab menu.
* Fix: Gallery images now render at their natural aspect ratio.

= 0.8.1 =
* Fix: Scope popover display:flex to :not([hidden]) so the hidden attribute takes effect.
* Fix: Add social links popover fallback for browsers without Web Share API.
* Fix: Close autocomplete dropdown on input blur.

= 0.8.0 =
* Add: Media Gallery block -- slider with dot navigation, prev/next arrows, drag and swipe gestures, and a (x/y) image counter. Compose multi-photo posts directly in the composer.
* Add: Popular tags and categories shown as horizontal pill chips in the autocomplete dropdown on focus, so the most-used items are reachable without typing.

= 0.7.0 =
* Add: Video tab in the post composer -- drag-and-drop video upload with optional caption, using the WordPress video post format.
* Fix: Video posts now embed the uploaded video as a WordPress video block in the post content.

= 0.6.0 =
* Link composer mode: paste a URL to post a rich link card via Better Bookmarks, or a plain linked paragraph as fallback.
* Link post editing: pre-fills the composer with stored URL and Open Graph preview when editing a link-format post.
* Fix EXIF stripping rotating photos incorrectly: autoOrient() now bakes EXIF orientation into pixel data before stripping the tag.
* Plugin Update Checker: GitHub release-based automatic updates via plugin-update-checker.
* Plugin Check compliance: prefixed render.php variables, shortened readme.txt short description, removed deprecated load_plugin_textdomain().

= 0.5.0 =
* Initial public release.
* Status, Photo, and Link composer modes.
* Edit Post, Delete Post, and Share Post blocks.
* Better Bookmarks integration for rich link cards.
* Tag and category typeahead with inline creation.
* EXIF stripping for JPEG uploads.
* Admin bar suppression settings.
