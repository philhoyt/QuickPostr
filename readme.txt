=== QuickPostr ===
Contributors: philhoyt
Tags: composer, post, social, front-end, gutenberg
Requires at least: 6.7
Tested up to: 6.9.4
Requires PHP: 8.1
Stable tag: 0.7.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Front-end post composer for WordPress. Logged-in users post status updates, photos, videos, and links without visiting /wp-admin.

== Description ==

Place the QuickPostr Composer block on any page. Logged-in users with the appropriate role see a composer with four modes:

* **Status** — Rich text editor with bold, italic, and inline links. Drafts auto-save every 800 ms.
* **Photo** — Drag-and-drop upload or WordPress media library picker. Optional caption.
* **Video** — Drag-and-drop video upload. Embeds the uploaded video as a WordPress video block in the post content.
* **Link** — Paste a URL to fetch Open Graph metadata and post a rich link card. Requires the [Better Bookmarks](https://github.com/philhoyt/BetterBookmarks) plugin for card display; falls back to a plain linked paragraph without it.

The composer is auth-gated server-side. Logged-out visitors see nothing.

Post titles are generated server-side from content. Titles are suppressed on the front end but remain visible in wp-admin and REST responses for ActivityPub and feed readers.

**Additional blocks**

* **Edit Post** — loads a post into the Composer for editing. Place inside a Query Loop template.
* **Delete Post** — trashes the current post. Place inside a Query Loop template.
* **Share Post** — calls `navigator.share()`. Requires HTTPS; hides itself on HTTP or when the API is unavailable.

**Requirements**

* A theme that declares `add_theme_support( 'post-formats', [...] )`
* PHP Imagick extension — only required for EXIF stripping

== Installation ==

1. Upload the `quickpostr` directory to `/wp-content/plugins/`.
2. Activate the plugin via **Plugins → Installed Plugins**.
3. Place the **QuickPostr Composer** block on any page using the block editor.
4. Configure access and behaviour at **Settings → QuickPostr**.

== Configuration ==

All settings are at **Settings → QuickPostr**.

* **Allowed Roles** — which roles can see and use the Composer block. Default: administrator, editor, author.
* **Default Post Status** — publish or draft. Set to draft to queue posts for review.
* **Default Category** — applied to every new post.
* **Show Slug Preview** — displays the auto-generated title preview below the editor.
* **Hide Admin Bar** — hides the WordPress admin bar for non-administrator roles.
* **Hide Admin Bar (Administrators)** — separate toggle for the administrator role.
* **Front-End Post Management** — enables the Edit Post and Delete Post blocks.
* **Strip Photo Metadata** — strips EXIF data (GPS, camera info) from JPEG uploads. Applies EXIF orientation to pixel data before stripping so images display correctly. Silently skipped if Imagick is unavailable.

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
