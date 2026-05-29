/**
 * Unit tests for the VideoMuxr REST helpers in api.js.
 *
 * api.js binds `window.quickpostrConfig` at module load, so the module is
 * re-required after the config is set up in each test.
 */
describe( 'VideoMuxr api helpers', () => {
	let api;

	beforeEach( () => {
		window.quickpostrConfig = {
			restUrl: 'https://example.com/wp-json/',
			nonce: 'test-nonce',
		};
		jest.resetModules();
		api = require( './api.js' );
		global.fetch = jest.fn();
	} );

	afterEach( () => {
		jest.useRealTimers();
		delete global.fetch;
	} );

	function mockJsonOnce( body, ok = true, status = 200 ) {
		global.fetch.mockResolvedValueOnce( {
			ok,
			status,
			json: async () => body,
		} );
	}

	describe( 'requestVideoMuxrUpload', () => {
		it( 'POSTs to the direct-upload route with the REST nonce', async () => {
			mockJsonOnce( { upload_id: 'up_1', upload_url: 'https://mux/up' } );

			const result = await api.requestVideoMuxrUpload();

			expect( result ).toEqual( {
				upload_id: 'up_1',
				upload_url: 'https://mux/up',
			} );
			const [ url, init ] = global.fetch.mock.calls[ 0 ];
			expect( url ).toBe(
				'https://example.com/wp-json/videomuxr/v1/direct-upload'
			);
			expect( init.method ).toBe( 'POST' );
			expect( init.headers[ 'X-WP-Nonce' ] ).toBe( 'test-nonce' );
		} );

		it( 'throws the server message on a non-ok response', async () => {
			mockJsonOnce( { message: 'Mux not configured' }, false, 500 );
			await expect( api.requestVideoMuxrUpload() ).rejects.toThrow(
				'Mux not configured'
			);
		} );
	} );

	describe( 'pollVideoMuxrStatus', () => {
		it( 'resolves with playback details when the asset is ready', async () => {
			mockJsonOnce( {
				status: 'ready',
				playback_id: 'pb_123',
				asset_id: 'as_456',
				aspect_ratio: '16:9',
			} );

			await expect( api.pollVideoMuxrStatus( 'up_1' ) ).resolves.toEqual(
				{
					playbackId: 'pb_123',
					assetId: 'as_456',
					aspectRatio: '16:9',
				}
			);
		} );

		it( 'rejects when Mux reports an errored asset', async () => {
			mockJsonOnce( { status: 'errored' } );
			await expect( api.pollVideoMuxrStatus( 'up_1' ) ).rejects.toThrow(
				/could not process/i
			);
		} );

		it( 'keeps polling while the status is not ready, then resolves', async () => {
			jest.useFakeTimers();
			mockJsonOnce( { status: 'waiting' } );
			mockJsonOnce( {
				status: 'ready',
				playback_id: 'pb_777',
				asset_id: 'as_888',
				aspect_ratio: '9:16',
			} );

			const promise = api.pollVideoMuxrStatus( 'up_1' );

			// First poll runs immediately and schedules the next via setTimeout.
			await Promise.resolve();
			await jest.advanceTimersByTimeAsync( 3000 );

			await expect( promise ).resolves.toEqual( {
				playbackId: 'pb_777',
				assetId: 'as_888',
				aspectRatio: '9:16',
			} );
			expect( global.fetch ).toHaveBeenCalledTimes( 2 );
		} );
	} );
} );
