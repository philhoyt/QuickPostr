/**
 * Post date helpers for the composer's date control.
 *
 * Everything here works in the *site's* wall-clock time, never the browser's.
 * A user travelling, or on a device set to another timezone, must still see and
 * pick the time the post will actually carry.
 *
 * The technique throughout: parse a naive "YYYY-MM-DDTHH:mm" string as though
 * it were UTC, do the arithmetic, then read it back with UTC getters. The
 * browser's own timezone never enters the calculation, so it cannot skew it.
 *
 * Wire format matters. WordPress's rest_parse_date() validates against
 * `\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}:\d{2}` — seconds are mandatory, and an
 * `<input type="datetime-local">` does not supply them. rest_get_date_with_gmt()
 * then reads an offset-less string as site-local, which is exactly what we want,
 * so no offset may ever be appended.
 */

const config = window.quickpostrConfig ?? {};

/** Core treats a date less than this far ahead as "now" and publishes it. */
const SCHEDULE_THRESHOLD_MS = 60 * 1000;

/**
 * Anchor the site clock to the server's time at page render.
 *
 * Captured once at module load. `siteNowLocalString()` advances it by elapsed
 * time, so a device with a wrong clock still gets the right "now".
 */
const anchorSiteMs = parseAsUtc( config.serverNow ?? '' );
const anchorElapsedFrom =
	typeof performance !== 'undefined' && performance.now
		? performance.now()
		: null;

/**
 * @param {number} value
 * @return {string} Zero-padded to two digits.
 */
function pad( value ) {
	return String( value ).padStart( 2, '0' );
}

/**
 * Parse a naive datetime string as UTC milliseconds.
 *
 * Deliberately ignores the browser's timezone — `new Date( '2026-08-20T14:30' )`
 * would apply it. Accepts an optional seconds component.
 *
 * @param {string} local — "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss".
 * @return {number|null} Epoch ms treated as UTC, or null if unparseable.
 */
function parseAsUtc( local ) {
	const match =
		/^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
			String( local ?? '' )
		);
	if ( ! match ) {
		return null;
	}
	return Date.UTC(
		Number( match[ 1 ] ),
		Number( match[ 2 ] ) - 1,
		Number( match[ 3 ] ),
		Number( match[ 4 ] ),
		Number( match[ 5 ] ),
		Number( match[ 6 ] ?? 0 )
	);
}

/**
 * Format a Date's UTC components as a datetime-local value.
 *
 * UTC getters only — using local getters here is the classic way to let the
 * browser's timezone leak back in and double-shift the result.
 *
 * @param {Date} date
 * @return {string} "YYYY-MM-DDTHH:mm".
 */
function formatUtcParts( date ) {
	return (
		`${ date.getUTCFullYear() }-${ pad( date.getUTCMonth() + 1 ) }-${ pad(
			date.getUTCDate()
		) }` +
		`T${ pad( date.getUTCHours() ) }:${ pad( date.getUTCMinutes() ) }`
	);
}

/**
 * Read "now" in the site's timezone via Intl.
 *
 * Only works for a named zone like "Europe/London". Sites on a manual UTC
 * offset report "+05:30" from wp_timezone_string(), which Intl rejects with a
 * RangeError.
 *
 * @return {string|null} "YYYY-MM-DDTHH:mm", or null if the zone is unusable.
 */
function siteNowViaIntl() {
	const zone = config.timezoneString;
	if ( ! zone || /^[+-]/.test( zone ) ) {
		return null;
	}

	try {
		const parts = new Intl.DateTimeFormat( 'en-US', {
			timeZone: zone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23',
		} ).formatToParts( new Date() );

		const get = ( type ) =>
			parts.find( ( part ) => part.type === type )?.value ?? '';

		const year = get( 'year' );
		const month = get( 'month' );
		const day = get( 'day' );
		if ( ! year || ! month || ! day ) {
			return null;
		}

		return `${ year }-${ month }-${ day }T${ get( 'hour' ) }:${ get(
			'minute'
		) }`;
	} catch ( _ ) {
		return null;
	}
}

/**
 * The current time in the site's timezone.
 *
 * Prefers the server anchor, then a named timezone via Intl, then the site's
 * numeric UTC offset. The last fallback is the only one that trusts the device
 * clock's absolute value.
 *
 * @return {string} "YYYY-MM-DDTHH:mm" — ready for a datetime-local input.
 */
export function siteNowLocalString() {
	if ( null !== anchorSiteMs && null !== anchorElapsedFrom ) {
		const elapsed = Math.max( 0, performance.now() - anchorElapsedFrom );
		return formatUtcParts( new Date( anchorSiteMs + elapsed ) );
	}

	const viaIntl = siteNowViaIntl();
	if ( viaIntl ) {
		return viaIntl;
	}

	const offsetMs = ( Number( config.gmtOffset ) || 0 ) * 60 * 60 * 1000;
	return formatUtcParts( new Date( Date.now() + offsetMs ) );
}

/**
 * Convert a datetime-local value into the string the REST API accepts.
 *
 * Adds the seconds component rest_parse_date() requires. No timezone offset is
 * appended: core reads an offset-less string as site-local, which is the whole
 * point.
 *
 * @param {string} local — a datetime-local input value, possibly empty.
 * @return {string|null} "YYYY-MM-DDTHH:mm:ss", or null when nothing was picked.
 */
export function toRestDate( local ) {
	const value = String( local ?? '' ).trim();
	if ( ! value ) {
		return null;
	}

	const match = /^(\d{4}-\d{2}-\d{2})[Tt ](\d{2}:\d{2})(?::(\d{2}))?$/.exec(
		value
	);
	if ( ! match ) {
		return null;
	}

	return `${ match[ 1 ] }T${ match[ 2 ] }:${ match[ 3 ] ?? '00' }`;
}

/**
 * Whether WordPress would schedule this date rather than publish immediately.
 *
 * Mirrors wp_insert_post(), which flips a publish to `future` only when the
 * date is at least a minute ahead. Using the same threshold keeps the UI's idea
 * of "scheduled" identical to the server's — otherwise a date twenty seconds
 * ahead would show a "Scheduled" notice for a post that published at once.
 *
 * @param {string} local — a datetime-local input value.
 * @return {boolean} True when WordPress would schedule rather than publish.
 */
export function isFuture( local ) {
	const picked = parseAsUtc( local );
	const now = parseAsUtc( siteNowLocalString() );
	if ( null === picked || null === now ) {
		return false;
	}
	return picked - now >= SCHEDULE_THRESHOLD_MS;
}

/**
 * Render a datetime-local value for display.
 *
 * Formatted in UTC on purpose: the value was parsed as UTC, so formatting it in
 * UTC shows the exact wall clock the user picked, in their locale's
 * conventions.
 *
 * @param {string} local — a datetime-local input value.
 * @return {string} Human-readable date and time, or '' if unparseable.
 */
export function formatForDisplay( local ) {
	const ms = parseAsUtc( local );
	if ( null === ms ) {
		return '';
	}

	return new Intl.DateTimeFormat( undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'UTC',
	} ).format( new Date( ms ) );
}

/**
 * Render a date for the auto-title label, matching PHP's 'M j, Y' format.
 *
 * PHP builds the fallback title from the post's own date, so a backdated post
 * is labelled with the backdate. Passing the composer's chosen date here keeps
 * the previewed title honest instead of always showing today.
 *
 * @param {string} local — a datetime-local value, or '' for the site's now.
 * @return {string} e.g. "Aug 20, 2026".
 */
export function titleDateString( local ) {
	const ms = parseAsUtc( local || siteNowLocalString() );
	if ( null === ms ) {
		return '';
	}

	return new Intl.DateTimeFormat( 'en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC',
	} ).format( new Date( ms ) );
}
