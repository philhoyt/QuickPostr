import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Block editor preview for quickpostr/profile-edit-name.
 */
export default function Edit() {
	return (
		<div { ...useBlockProps() }>
			<span className="qp-profile-edit__value">
				{ __( 'Display Name', 'quickpostr' ) }
			</span>
			<span className="qp-profile-edit__controls">
				<button type="button" className="qp-profile-edit__edit-btn" disabled>
					{ __( 'Edit', 'quickpostr' ) }
				</button>
			</span>
		</div>
	);
}
