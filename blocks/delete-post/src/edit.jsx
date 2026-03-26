import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Block editor preview for quickpostr/delete-post.
 * Shows a disabled placeholder — the real button only renders on the front end.
 */
export default function Edit() {
	return (
		<div { ...useBlockProps() }>
			<button type="button" className="qp-delete-post__btn" disabled>
				{ __( 'Delete', 'quickpostr' ) }
			</button>
		</div>
	);
}
