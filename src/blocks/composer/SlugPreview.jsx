import { __ } from '@wordpress/i18n';

const config = window.quickpostrConfig ?? {};

/**
 * Displays the auto-generated title preview below the composer.
 * Hidden when showSlugPreview is false in block attributes or settings.
 *
 * Future: allow user to override the title for "micro long-form" posts.
 *
 * Props:
 *   title {string} — generated title to display
 * @param {Object} root0
 * @param {string} root0.title
 */
export default function SlugPreview( { title } ) {
	const showFromAttrs = config.blockAttrs?.showSlugPreview;
	const showFromSettings = config.settings?.showSlugPreview;
	const show = showFromAttrs !== undefined ? showFromAttrs : showFromSettings;

	if ( ! show || ! title ) {
		return null;
	}

	return (
		<p
			className="qp-slug-preview"
			aria-label={ __( 'Auto-generated title preview', 'quickpostr' ) }
		>
			<span className="qp-slug-preview__label">{ __( 'Title', 'quickpostr' ) }</span>
			<span className="qp-slug-preview__value">{ title }</span>
		</p>
	);
}
