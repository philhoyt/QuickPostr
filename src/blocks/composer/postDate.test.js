/**
 * Unit tests for postDate.js.
 *
 * The harness timezone is deliberately set to a non-UTC zone before anything
 * else loads. Every assertion below concerns the *site's* wall clock, so if the
 * implementation ever read a local getter instead of a UTC one, the browser
 * timezone would leak in and these tests would shift by five hours.
 */
process.env.TZ = 'America/New_York';

/**
 * Load postDate.js fresh against a given config.
 *
 * The module captures its server-time anchor at load, so config has to be in
 * place before the require.
 *
 * @param {Object} config — the window.quickpostrConfig to expose.
 * @return {Object} The re-required module.
 */
function loadWith( config ) {
	window.quickpostrConfig = config;
	jest.resetModules();
	return require( './postDate.js' );
}

describe( 'postDate', () => {
	afterEach( () => {
		jest.useRealTimers();
		jest.restoreAllMocks();
		delete window.quickpostrConfig;
	} );

	it( 'runs under a non-UTC harness timezone', () => {
		// Guards the value of every other test in this file: if TZ did not take
		// effect, a local-getter bug would pass unnoticed.
		expect( new Date( '2026-01-01T00:00:00Z' ).getHours() ).not.toBe( 0 );
	} );

	describe( 'toRestDate', () => {
		it( 'appends the seconds that rest_parse_date() requires', () => {
			const { toRestDate } = loadWith( {} );
			expect( toRestDate( '2026-08-20T14:30' ) ).toBe(
				'2026-08-20T14:30:00'
			);
		} );

		it( 'never appends a timezone offset', () => {
			const { toRestDate } = loadWith( {} );
			// An offset would make core read the value as UTC instead of
			// site-local, shifting every backdated post.
			expect( toRestDate( '2026-08-20T14:30' ) ).not.toMatch(
				/[Zz]|[+-]\d{2}:?\d{2}$/
			);
		} );

		it( 'keeps a seconds component that is already present', () => {
			const { toRestDate } = loadWith( {} );
			expect( toRestDate( '2026-08-20T14:30:45' ) ).toBe(
				'2026-08-20T14:30:45'
			);
		} );

		it( 'returns null for an empty value', () => {
			const { toRestDate } = loadWith( {} );
			expect( toRestDate( '' ) ).toBeNull();
			expect( toRestDate( null ) ).toBeNull();
			expect( toRestDate( undefined ) ).toBeNull();
		} );

		it( 'returns null for a malformed value rather than sending garbage', () => {
			const { toRestDate } = loadWith( {} );
			expect( toRestDate( 'tomorrow' ) ).toBeNull();
			expect( toRestDate( '2026-08-20' ) ).toBeNull();
		} );
	} );

	describe( 'siteNowLocalString', () => {
		it( 'trusts the server anchor over a badly wrong device clock', () => {
			const { siteNowLocalString } = loadWith( {
				serverNow: '2026-08-20T14:30:00',
				timezoneString: 'Europe/London',
				gmtOffset: 1,
			} );

			// A device stuck in 2001 must not drag the composer back with it.
			jest.spyOn( Date, 'now' ).mockReturnValue(
				new Date( '2001-01-01T00:00:00Z' ).getTime()
			);

			expect( siteNowLocalString() ).toBe( '2026-08-20T14:30' );
		} );

		it( 'uses the named site timezone when there is no anchor', () => {
			jest.useFakeTimers();
			jest.setSystemTime( new Date( '2026-08-20T09:00:00Z' ) );

			// Asia/Kolkata is UTC+5:30 — a half-hour offset catches arithmetic
			// that assumes whole hours.
			const { siteNowLocalString } = loadWith( {
				timezoneString: 'Asia/Kolkata',
				gmtOffset: 5.5,
			} );

			expect( siteNowLocalString() ).toBe( '2026-08-20T14:30' );
		} );

		it( 'falls back to the numeric offset on a manual-UTC-offset site', () => {
			jest.useFakeTimers();
			jest.setSystemTime( new Date( '2026-08-20T09:00:00Z' ) );

			// wp_timezone_string() returns "+05:30" rather than a zone name when
			// the site is configured with a manual offset. Intl rejects that.
			const { siteNowLocalString } = loadWith( {
				timezoneString: '+05:30',
				gmtOffset: 5.5,
			} );

			expect( siteNowLocalString() ).toBe( '2026-08-20T14:30' );
		} );

		it( 'handles a negative manual offset', () => {
			jest.useFakeTimers();
			jest.setSystemTime( new Date( '2026-08-20T09:00:00Z' ) );

			const { siteNowLocalString } = loadWith( {
				timezoneString: '-06:00',
				gmtOffset: -6,
			} );

			expect( siteNowLocalString() ).toBe( '2026-08-20T03:00' );
		} );

		it( 'produces a value a datetime-local input accepts', () => {
			const { siteNowLocalString } = loadWith( {
				serverNow: '2026-08-20T14:30:00',
			} );
			expect( siteNowLocalString() ).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
			);
		} );
	} );

	describe( 'isFuture', () => {
		/** Anchor the site clock so "now" is deterministic. */
		const NOW = '2026-08-20T14:30:00';

		it( 'is false for a date in the past', () => {
			const { isFuture } = loadWith( { serverNow: NOW } );
			expect( isFuture( '2026-08-19T14:30' ) ).toBe( false );
		} );

		it( 'is false inside core’s one-minute grace window', () => {
			const { isFuture } = loadWith( { serverNow: NOW } );
			// wp_insert_post() publishes rather than schedules below a minute,
			// so the UI must not promise scheduling here.
			expect( isFuture( '2026-08-20T14:30' ) ).toBe( false );
		} );

		it( 'is true at exactly one minute ahead, matching wp_insert_post()', () => {
			const { isFuture } = loadWith( { serverNow: NOW } );
			expect( isFuture( '2026-08-20T14:31' ) ).toBe( true );
		} );

		it( 'is true for a date well ahead', () => {
			const { isFuture } = loadWith( { serverNow: NOW } );
			expect( isFuture( '2026-09-01T09:00' ) ).toBe( true );
		} );

		it( 'is false for an empty or malformed value', () => {
			const { isFuture } = loadWith( { serverNow: NOW } );
			expect( isFuture( '' ) ).toBe( false );
			expect( isFuture( 'whenever' ) ).toBe( false );
		} );
	} );

	describe( 'formatForDisplay', () => {
		it( 'shows the wall clock that was picked, unshifted', () => {
			const { formatForDisplay } = loadWith( {} );
			const output = formatForDisplay( '2026-08-20T14:30' );
			// Formatted in UTC so the browser timezone cannot move it; under
			// America/New_York a local-getter bug would render 10:30.
			expect( output ).toMatch( /2026/ );
			expect( output ).toMatch( /2:30|14:30/ );
		} );

		it( 'returns an empty string for an unparseable value', () => {
			const { formatForDisplay } = loadWith( {} );
			expect( formatForDisplay( '' ) ).toBe( '' );
			expect( formatForDisplay( 'nope' ) ).toBe( '' );
		} );
	} );
} );
