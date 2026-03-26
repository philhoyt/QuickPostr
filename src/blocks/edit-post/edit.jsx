import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Block editor preview for quickpostr/edit-post.
 * Shows a disabled placeholder — the real link only renders on the front end.
 */
export default function Edit() {
	return (
		<div { ...useBlockProps() }>
			<button
				type="button"
				className="qp-edit-post__btn"
				disabled
			>
				{ __( 'Edit', 'quickpostr' ) }
			</button>
		</div>
	);
}
