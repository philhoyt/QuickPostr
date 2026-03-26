import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Block editor preview for quickpostr/profile-edit-bio.
 */
export default function Edit() {
	return (
		<div { ...useBlockProps() }>
			<p className="qp-profile-edit__value">
				{ __( 'User bio goes here…', 'quickpostr' ) }
			</p>
			<span className="qp-profile-edit__controls">
				<button type="button" className="qp-profile-edit__edit-btn" disabled>
					{ __( 'Edit', 'quickpostr' ) }
				</button>
			</span>
		</div>
	);
}
