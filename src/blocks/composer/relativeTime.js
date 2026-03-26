/**
 * Format an ISO UTC timestamp as a relative time string.
 *
 * @param {string} isoUtc — UTC ISO string (with or without trailing Z).
 * @returns {string}
 */
export function relativeTime( isoUtc ) {
	// Ensure UTC interpretation.
	const normalized = isoUtc.endsWith( 'Z' ) ? isoUtc : isoUtc + 'Z';
	const date       = new Date( normalized );
	const diffMs     = Date.now() - date.getTime();
	const diffSec    = Math.floor( diffMs / 1000 );

	if ( diffSec < 60 ) {
		return 'just now';
	}

	const diffMin = Math.floor( diffSec / 60 );
	if ( diffMin < 60 ) {
		return diffMin + 'm';
	}

	const diffHr = Math.floor( diffMin / 60 );
	if ( diffHr < 24 ) {
		return diffHr + 'h';
	}

	const months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
	const month  = months[ date.getMonth() ];
	const day    = date.getDate();

	const oneYearMs = 365 * 24 * 60 * 60 * 1000;
	if ( diffMs < oneYearMs ) {
		return month + ' ' + day;
	}

	return month + ' ' + day + ', ' + date.getFullYear();
}
