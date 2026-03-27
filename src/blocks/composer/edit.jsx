/**
 * Block editor preview for the QuickPostr Composer block.
 *
 * Renders a static, non-interactive mockup with InspectorControls for the
 * three block attributes. The real composer only runs on the front end.
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

export default function Edit( { attributes, setAttributes } ) {
	const { defaultMode, showSlugPreview, placeholderText } = attributes;
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
						options={ [
							{
								label: __( 'Status', 'quickpostr' ),
								value: 'status',
							},
							{
								label: __( 'Photo', 'quickpostr' ),
								value: 'photo',
							},
						] }
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
					<ToggleControl
						label={ __( 'Show Slug Preview', 'quickpostr' ) }
						help={ __(
							'Display the auto-generated title preview below the composer.',
							'quickpostr'
						) }
						checked={ showSlugPreview }
						onChange={ ( value ) =>
							setAttributes( { showSlugPreview: value } )
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
						<span
							className={ `quickpostr-composer-preview__mode-btn${
								defaultMode === 'status' ? ' is-active' : ''
							}` }
						>
							{ __( 'Status', 'quickpostr' ) }
						</span>
						<span
							className={ `quickpostr-composer-preview__mode-btn${
								defaultMode === 'photo' ? ' is-active' : ''
							}` }
						>
							{ __( 'Photo', 'quickpostr' ) }
						</span>
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
