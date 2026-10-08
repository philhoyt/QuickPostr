/**
 * Block editor preview for the QuickPostr Composer block.
 *
 * Renders a static, non-interactive mockup with InspectorControls for the
 * block attributes. The real composer only runs on the front end.
 */
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	RadioControl,
	TextControl,
	ToggleControl,
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

// Must match the `defaultMode` enum in block.json and the mode bar in Composer.jsx.
const MODES = [
	{ value: 'status', label: __( 'Status', 'quickpostr' ) },
	{ value: 'photo', label: __( 'Photo', 'quickpostr' ) },
	{ value: 'video', label: __( 'Video', 'quickpostr' ) },
	{ value: 'link', label: __( 'Link', 'quickpostr' ) },
];

export default function Edit( { attributes, setAttributes } ) {
	const { defaultMode, placeholderText } = attributes;
	const blockProps = useBlockProps( {
		className: 'quickpostr-composer-preview',
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Composer Settings', 'quickpostr' ) }>
					<RadioControl
						label={ __( 'Default Mode', 'quickpostr' ) }
						selected={ defaultMode }
						options={ MODES }
						onChange={ ( value ) =>
							setAttributes( { defaultMode: value } )
						}
					/>
					<TextControl
						label={ __( 'Placeholder Text', 'quickpostr' ) }
						value={ placeholderText }
						onChange={ ( value ) =>
							setAttributes( { placeholderText: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<Notice
					status="info"
					isDismissible={ false }
					className="quickpostr-composer-preview__notice"
				>
					{ __(
						'QuickPostr Composer — front-end only. Logged-in users with posting capability will see the composer here.',
						'quickpostr'
					) }
				</Notice>

				<div
					className="quickpostr-composer-preview__shell"
					aria-hidden="true"
				>
					<div className="quickpostr-composer-preview__mode-bar">
						{ MODES.map( ( { value, label } ) => (
							<span
								key={ value }
								className={ `quickpostr-composer-preview__mode-btn${
									defaultMode === value ? ' is-active' : ''
								}` }
							>
								{ label }
							</span>
						) ) }
					</div>

					{ defaultMode === 'status' && (
						<div className="quickpostr-composer-preview__textarea">
							{ placeholderText }
						</div>
					) }

					{ defaultMode === 'photo' && (
						<div className="quickpostr-composer-preview__upload-zone">
							<span>+</span>
							<span>
								{ __( 'Tap to add a photo', 'quickpostr' ) }
							</span>
						</div>
					) }

					{ defaultMode === 'video' && (
						<div className="quickpostr-composer-preview__upload-zone">
							<span>+</span>
							<span>
								{ __( 'Tap to add a video', 'quickpostr' ) }
							</span>
						</div>
					) }

					{ defaultMode === 'link' && (
						<div className="quickpostr-composer-preview__textarea">
							{ __( 'Paste a URL…', 'quickpostr' ) }
						</div>
					) }

					<div className="quickpostr-composer-preview__footer">
						<span className="quickpostr-composer-preview__submit">
							{ __( 'Post', 'quickpostr' ) }
						</span>
					</div>
				</div>
			</div>
		</>
	);
}
