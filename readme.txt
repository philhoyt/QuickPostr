=== QuickPostr ===
Contributors: philhoyt
Tags: composer, post, social, front-end, gutenberg
Requires at least: 6.7
Tested up to: 7.1
Requires PHP: 8.1
Stable tag: 0.20.1
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A front-end post composer block for posting status updates, photos, videos and links without opening wp-admin

== Description ==

Place the QuickPostr Composer block on a page. Logged-in users in the roles you choose see a composer with four modes; everyone else sees nothing.

* Status: a rich text editor with bold, italic and inline links. Drafts save 800 ms after you stop typing. A blank line starts a new paragraph.
* Photo: drag-and-drop upload or the Media Library picker, with an optional caption and alt text. Selecting several images posts a gallery, which can be reordered before posting.
* Video: drag-and-drop upload or the Media Library picker. The video is embedded as a Video block in the post content.
* Link: paste a URL to post a link card with Open Graph metadata. The card needs the Better Bookmarks plugin (https://github.com/philhoyt/BetterBookmarks); without it the post is a paragraph with a plain link.

Every mode can set categories and tags, give the post its own title, and set the date to backdate or schedule it.

Posts get a title generated from their content. Generated titles are hidden on the front end but stay in wp-admin and REST responses for ActivityPub and feed readers. A title you type yourself is shown everywhere.

Three more blocks go inside a Query Loop template:

* Post Actions: a menu with Edit and Delete for the current post. Edit opens the post in the WordPress editor.
* Like Post: a heart button with a like count, for logged-in and logged-out visitors.
* Share Post: calls the browser's share sheet where it exists (HTTPS only). Browsers without it get a popover with X, Facebook and Copy link.

A QuickPostr Slider block style for the Gallery block turns a gallery into a scroll-snap slider with dots, arrows and swipe. A "Composer with post feed" block pattern, under the QuickPostr category in the inserter, puts the composer above a feed of posts with the author avatar, date, actions menu, featured image, title, content, and like and share buttons.

Installed as a web app on Android, QuickPostr appears in the share sheet. Sharing a photo to it opens the composer with that photo loaded.

Companion plugins add more: GeoTagr (https://github.com/philhoyt/geotagr) adds a Location button to the composer, and VideoMuxr (https://github.com/philhoyt/VideoMuxr) sends video uploads to Mux for transcoding and hosted playback.

**Requirements**

* A theme with post-formats support. Posts are saved with the status, image, video, gallery and link formats.
* The PHP Imagick extension, only if you want photo metadata stripped on upload.

== Installation ==

1. Upload the `quickpostr` directory to `/wp-content/plugins/`.
2. Activate the plugin under Plugins > Installed Plugins.
3. Add the QuickPostr Composer block to a page in the block editor.
4. Set who sees it and how posts are created under Settings > QuickPostr.

== Configuration ==

Settings > QuickPostr has these options:

* Show Composer To: which roles see the Composer block. Default: administrator, editor, author. This controls visibility only; whether a user can publish is decided by their WordPress capabilities, as in the block editor.
* Default Post Status: publish or draft. Draft queues posts for review.
* Default Category: applied to every new post.
* Hide Admin Bar: hides the admin bar for roles other than administrator.
* Hide Admin Bar (Administrators): the same for administrators.
* Front-End Post Management: turns the Edit and Delete actions in the Post Actions block on or off.
* Strip Photo Metadata: removes EXIF and XMP data (GPS, camera details) from JPEG, PNG and WebP uploads. EXIF orientation is applied to the pixels first so photos stay the right way up. Skipped without a message when Imagick is not installed.
* Composer Page: the page that holds the Composer block. It is the web app's start page and where shared photos are sent.

The page also shows whether GeoTagr and Better Bookmarks are active. All settings live in one `wp_options` row, `quickpostr_settings`.

== Frequently Asked Questions ==

= Does the composer work for logged-out users? =

No. The block renders nothing for logged-out visitors. There is no login prompt.

= How are post titles generated? =

PHP sets the title in `rest_after_insert_post`; the composer sends an empty title and the server fills it in. Content of 55 characters or fewer becomes the title. Longer content is cut at the last word break before 55 characters and given an ellipsis. A post with no text (a photo, video or link without a caption) gets the format name and the date, such as "Photo" followed by "Jan 15, 2026". Type your own title in the field above the composer to override this.

= What authentication method is used? =

Cookie authentication with an `X-WP-Nonce` header, the same as the block editor. Application Passwords are not used. The nonce is printed into the page by `render.php` before the view script runs.

= How do I query only QuickPostr posts? =

QuickPostr registers a private `quickpostr_source` taxonomy. Each post gets the term `app` and one of `status`, `photo`, `video` or `link`. Filter with `tax_query`:

    $query = new WP_Query( [
        'tax_query' => [ [
            'taxonomy' => 'quickpostr_source',
            'field'    => 'slug',
            'terms'    => 'app',
        ] ],
    ] );

= Does the Share Post block work on desktop? =

Most desktop browsers have no `navigator.share()`. There the button opens a popover with X, Facebook and Copy link instead. Where the API exists it needs HTTPS.

= Does metadata stripping cover every image type? =

JPEG, PNG and WebP, when the server has the Imagick extension. HEIC, GIF and AVIF keep their metadata, as does every format on a server with only GD.

= What personal data does QuickPostr handle? =

* Likes are stored as comments: the liker's user account and email when logged in, or the name and optional email they typed plus a one-way hash of their IP address when logged out. Likes appear in the WordPress personal data export and are removed by an erasure request (Tools > Export/Erase Personal Data). The like button also remembers liked posts in the visitor's browser (`localStorage`).
* Location (with GeoTagr) sends the author's coordinates or typed place name to the configured geocoding provider (OpenStreetMap Nominatim, Google or Mapbox), which sees their IP address. The resulting place and coordinates are stored on the post and are public.
* Photos shared through the device share sheet are uploaded before the author publishes. Unused ones are deleted after 24 hours.
* Photo metadata, GPS included, is stripped on upload when the setting is on and Imagick is available.

QuickPostr adds suggested text covering all of this under Settings > Privacy > Policy Guide. Uninstalling removes all like records, pending shared uploads, the plugin's post meta, options and transients. Posts written through the composer are kept.

== Changelog ==

= 0.20.1 =
* Tested against WordPress 7.1 and rebuilt with the current block editor toolchain.

= 0.20.0 =
* Added storing status posts as Paragraph blocks, so they open in the block editor as blocks and render through the Post Content block without a Classic block.
* Changed the status composer so a blank line starts a new paragraph and a single line break stays inside the paragraph. Bold, italic and links that cross a blank line are closed and reopened in each paragraph.
* Changed draft resuming to restore text and formatting from the block markup. Drafts saved by earlier versions still resume.
* Changed link posts made without Better Bookmarks to be stored as a Paragraph block with an escaped link.

= 0.19.0 =
* Added an alt text field for each photo in the composer. The caption is used when it is left empty.
* Added a title chip above the editor, next to the date chip.
* Added likes to the personal data export and erasure (Tools > Export/Erase Personal Data). The suggested privacy policy text now covers geocoding, shared uploads and browser storage, and the readme has a privacy FAQ.
* Added rate limiting per IP address for likes from logged-out visitors, and capped the submitted name at 100 characters.
* Changed the composer, like button, post actions menu, share popover and gallery slider to work with a keyboard and a screen reader: visible focus rings, announced status, correct toggle and dialog semantics, focus kept in place when items appear or disappear, and reduced-motion support.
* Changed location search to run on Enter or the Search button instead of on every keystroke, as the OpenStreetMap Nominatim usage policy requires.
* Changed the category and tag pickers to be labelled and keyboard-navigable, with categories first and the Post button on the same row.
* Renamed the "Allowed Roles" setting to "Show Composer To". It controls who sees the composer; publishing is governed by WordPress capabilities.
* Changed like counts to be cached per post, so a feed no longer runs a comment query for every post.
* Changed photo metadata stripping to cover PNG and WebP as well as JPEG.
* Changed the PWA manifest link to be output only for users who can post, and made the manifest cacheable.
* Changed uninstall to also remove the plugin's post meta, unused shared uploads, transients and version option.
* Fixed the service worker and manifest redirecting to trailing-slash URLs, which stopped the share target installing on sites with pretty permalinks.
* Fixed the daily cleanup of unused shared uploads not scheduling itself on sites updated in place; it previously ran only after reactivating the plugin.
* Fixed the Bold and Italic toolbar buttons reporting the wrong state, the draft banner and like dialog failing contrast requirements, and the Delete item staying visible while its confirmation is shown.
* Fixed the share target accepting files that are not images; they are now refused and removed.
* Security: the like endpoint checks public viewability, so posts of non-public types can be neither enumerated nor liked.
* Security: the share target refuses requests from other sites, checks the Origin and Referer headers, and only the user who shared an upload can attach it to a post.

= 0.18.0 =
* Added a "Composer with post feed" block pattern. It puts the composer above a feed of posts, each with the author avatar, date, actions menu, featured image, title, content, and like and share buttons. It is in the inserter under the QuickPostr category. When GeoTagr is active the pattern also shows the post's location.

= 0.17.0 =
* Added a date control to the composer, in all four modes. A past date backdates the post; a future one schedules it. Times are the site's, so the date you pick is the date the post carries wherever you are.
* Added a "Scheduled for..." confirmation for posts dated in the future, instead of reloading into a feed the post has not appeared in yet.
* Added a title field above the composer. It shows the generated title as its placeholder, so you can see what the post will be called and type over it. Titles you write are shown on the front end; generated ones stay hidden.
* Added removal of the plugin's like records, settings and terms on uninstall. Posts written through the composer are left alone.
* Security: closed a hole in the like button. A logged-out visitor could like the same post without limit by sending a different email address each time, inflating the count and adding a database row on every request.
* Security: the PWA share endpoint now refuses uploads that the browser reports as coming from another site, and limits how many shares one account can make per hour.
* Changed likes from logged-out visitors to store a one-way hash instead of the IP address. They are still counted once each. QuickPostr now suggests privacy policy text describing what a like records.
* Changed the date and location controls to share one row. The location button now stays in place and opens and closes the panel instead of disappearing.
* Changed post creation to go through WordPress's own REST route. The /quickpostr/v1/posts endpoints still work but are deprecated and will be removed in 1.0.0.
* Tested up to WordPress 7.1.
* Fixed a typed place name being lost when location detection fails or the search finds no match.
* Fixed the date field jumping back to "now" while being edited.
* Fixed the composer submitting an empty post that WordPress rejects.
* Fixed keyboard focus being invisible on the post editor and the tag field.
* Removed the slug preview, replaced by the editable title field above the composer. Its setting and block option are gone.

= 0.16.1 =
* Fixed a fatal error, "Class Parsedown not found", on update checks. The bundled update checker's Parsedown files were excluded from the release zip and are now included.

= 0.16.0 =
* Added sharing a photo to QuickPostr from a phone. Install QuickPostr as a web app (PWA) and it appears in the Android share sheet. Sharing a photo opens the composer with that image loaded.
* Added the Composer Page setting (Settings > QuickPostr). It names the page that holds the Composer block, which becomes the app's start page and where shared photos are sent.

= 0.15.1 =
* Fixed the gallery slider skipping photos on a fast flick. Swipes now advance one photo at a time.

= 0.15.0 =
* Changed front-end editing to open the WordPress editor instead of an inline composer. The front-end composer is now only for creating posts.

= 0.14.0 =
* Added VideoMuxr companion plugin support. When VideoMuxr is active, video uploads go to Mux for transcoding and hosted playback, and it is listed under Companion Plugins in the settings.
* Changed single photos to be saved as an Image block in the post content instead of a featured image, like the other post formats. Existing photo posts are unaffected.
* Security: logged-out likes are deduplicated by IP address to prevent like-count inflation.
* Changed the like, share and gallery slider front-end strings to be translatable.
* Changed minor composer UI details and tested up to WordPress 7.0.

= 0.13.4 =
* Fixed gallery slider images not being vertically centred, by overriding the WordPress block layout styles that broke slide heights.

= 0.13.3 =
* Fixed block.json version strings not matching the plugin version, so assets are cache-busted on update.

= 0.13.2 =
* Fixed the location chip overflowing the composer on long place names; it now wraps.
* Fixed the gallery photo preview not being vertically centred in the preview area.

= 0.13.1 =
* Fixed location search on hosted servers. The user's GPS coordinates are passed as a location bias to the Places API, so the server's IP location no longer skews results.
* Fixed forward geocoding with the Google provider returning a single result; it now returns up to 5.

= 0.13.0 =
* Fixed geo-tagged posts losing their coordinates and place name when published from a draft.
* Added typing a custom place name in the location chip, without picking a search result.
* Added an "Add a name" placeholder in the location chip when coordinates are attached but no place name is set.

= 0.12.2 =
* Added a Change button to the location chip, so a wrong auto-detected address can be corrected without dismissing it and starting over.

= 0.12.1 =
* Fixed the block stylesheet not cache-busting after updates, which left the location chip and gallery reorder styles missing on the first visit after an upgrade.

= 0.12.0 =
* Added reordering photos in the gallery composer before posting, by drag and drop or with arrow buttons.
* Added a GeoTagr companion plugin notice with an install link on the settings page when GeoTagr is not active.

= 0.11.0 =
* Added location tagging in the composer. When the GeoTagr companion plugin is active, a Location button appears in the composer toolbar. Tap it to detect the location with the browser Geolocation API, or enter an address. The four GeoTagr meta keys are saved on the post on submit.
* Fixed address search always calling Nominatim; it now uses GeoTagr's configured geocoding provider (Google, Nominatim or Mapbox).
* Fixed the location chip overflowing the composer container.

= 0.10.2 =
* Fixed portrait videos uploaded from a phone rendering with the wrong aspect ratio on the front end.

= 0.10.1 =
* Fixed editing a photo post with several images creating a duplicate post instead of updating the existing one.

= 0.10.0 =
* Added a "choose from library" option to the video composer, matching the photo composer.
* Fixed photo post editing to pre-fill the existing image and caption, so the image can be replaced or the caption changed without re-uploading.
* Fixed editing video, gallery and link posts to open the WordPress editor instead of trying to parse block content.

= 0.9.1 =
* Fixed a semi-transparent overlay left on screen in Chrome for Android after uploading a video.

= 0.9.0 =
* Added the Like Post block with a heart toggle and live like count for logged-in and logged-out visitors.
* Added the QuickPostr Slider block style, a scroll-snap slider for Gallery blocks.
* Added selecting several images at once from the Media Library in the photo composer.
* Replaced the Edit Post and Delete Post blocks with one Post Actions menu.
* Fixed gallery images not rendering at their natural aspect ratio.

= 0.8.1 =
* Fixed the popover's `display: flex` overriding the `hidden` attribute; it is now scoped to `:not([hidden])`.
* Added a social links popover fallback for browsers without the Web Share API.
* Fixed the autocomplete dropdown staying open when the input loses focus.

= 0.8.0 =
* Added the Media Gallery block: a slider with dot navigation, previous and next arrows, drag and swipe, and an (x/y) counter. Multi-photo posts can be composed in the composer.
* Added popular tags and categories as pill chips in the autocomplete dropdown on focus, so the most-used ones are reachable without typing.

= 0.7.0 =
* Added a Video tab to the composer: drag-and-drop video upload with an optional caption, using the video post format.
* Fixed video posts to embed the uploaded video as a Video block in the post content.

= 0.6.0 =
* Added the Link composer mode: paste a URL to post a link card through Better Bookmarks, or a paragraph with a plain link without it.
* Added link post editing, pre-filling the composer with the stored URL and Open Graph preview.
* Fixed EXIF stripping rotating photos: orientation is now applied to the pixel data before the tag is removed.
* Added automatic updates from GitHub releases through Plugin Update Checker.
* Fixed Plugin Check findings: prefixed render.php variables, shortened the readme.txt short description, removed the deprecated load_plugin_textdomain() call.

= 0.5.0 =
* Initial public release.
* Status, Photo and Link composer modes.
* Edit Post, Delete Post and Share Post blocks.
* Better Bookmarks integration for link cards.
* Tag and category typeahead with inline creation.
* EXIF stripping for JPEG uploads.
* Admin bar settings.
