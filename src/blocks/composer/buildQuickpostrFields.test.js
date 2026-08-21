/**
 * Unit tests for buildQuickpostrFields() in api.js.
 *
 * These fields are the only way the composer writes GeoTagr and VideoMuxr
 * post meta now that every composer posts to /wp/v2/posts. The important
 * property is that a key is omitted *entirely* when there is no data for it:
 * an empty object would still invoke the server-side update callback.
 *
 * api.js binds `window.quickpostrConfig` at module load, so the module is
 * re-required after the config is set up.
 */
describe( 'buildQuickpostrFields', () => {
	let buildQuickpostrFields;

	beforeEach( () => {
		window.quickpostrConfig = {
			restUrl: 'https://example.com/wp-json/',
			nonce: 'test-nonce',
		};
		jest.resetModules();
		( { buildQuickpostrFields } = require( './api.js' ) );
	} );

	const activeGeo = {
		active: true,
		lat: 51.5072,
		lng: -0.1276,
		place: 'London',
		address: 'Westminster, London',
	};

	it( 'returns an empty object when there is no geo and no video', () => {
		expect( buildQuickpostrFields( null ) ).toEqual( {} );
	} );

	it( 'maps active geo state onto quickpostr_geo', () => {
		expect( buildQuickpostrFields( activeGeo ) ).toEqual( {
			quickpostr_geo: {
				lat: 51.5072,
				lng: -0.1276,
				place: 'London',
				address: 'Westminster, London',
			},
		} );
	} );

	it( 'omits quickpostr_geo when the geo bar was dismissed', () => {
		expect(
			buildQuickpostrFields( { ...activeGeo, active: false } )
		).toEqual( {} );
	} );

	it( 'omits quickpostr_geo when geolocation failed and left a null lat', () => {
		// An active-but-empty geo state is not a location to save.
		expect(
			buildQuickpostrFields( {
				active: true,
				lat: null,
				lng: null,
				place: '',
				address: '',
			} )
		).toEqual( {} );
	} );

	it( 'sends a typed place name even with no coordinates', () => {
		// Geolocation denied, user typed a name Nominatim could not match.
		const result = buildQuickpostrFields( {
			active: true,
			lat: null,
			lng: null,
			place: 'My Back Garden',
			address: '',
		} );
		expect( result.quickpostr_geo ).toEqual( { place: 'My Back Garden' } );
	} );

	it( 'omits lat/lng entirely rather than sending null', () => {
		// The field schema types them as numbers, so null fails validation, and
		// a (float) cast of null would tag the post at 0,0.
		const result = buildQuickpostrFields( {
			active: true,
			lat: null,
			lng: null,
			place: 'Somewhere',
			address: 'Some road',
		} );
		expect( 'lat' in result.quickpostr_geo ).toBe( false );
		expect( 'lng' in result.quickpostr_geo ).toBe( false );
		expect( result.quickpostr_geo.address ).toBe( 'Some road' );
	} );

	it( 'still omits quickpostr_geo when there is neither a coord nor a name', () => {
		expect(
			buildQuickpostrFields( {
				active: true,
				lat: null,
				lng: null,
				place: '   ',
				address: '',
			} )
		).toEqual( {} );
	} );

	it( 'accepts a zero latitude rather than treating it as missing', () => {
		const result = buildQuickpostrFields( {
			active: true,
			lat: 0,
			lng: 0,
			place: 'Null Island',
			address: '',
		} );
		expect( result.quickpostr_geo.lat ).toBe( 0 );
		expect( result.quickpostr_geo.lng ).toBe( 0 );
	} );

	it( 'maps Mux ids onto quickpostr_video', () => {
		expect(
			buildQuickpostrFields( null, {
				playbackId: 'pb_123',
				assetId: 'as_456',
			} )
		).toEqual( {
			quickpostr_video: { playback_id: 'pb_123', asset_id: 'as_456' },
		} );
	} );

	it( 'omits quickpostr_video for a non-Mux video post', () => {
		expect( buildQuickpostrFields( null, null ) ).toEqual( {} );
	} );

	it( 'emits both keys for a geotagged Mux video', () => {
		const result = buildQuickpostrFields( activeGeo, {
			playbackId: 'pb_123',
			assetId: 'as_456',
		} );
		expect( Object.keys( result ).sort() ).toEqual( [
			'quickpostr_geo',
			'quickpostr_video',
		] );
	} );
} );
