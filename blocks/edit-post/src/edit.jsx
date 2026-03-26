import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Block editor preview for quickpostr/edit-post.
 * Shows a disabled placeholder — the real link only renders on the front end.
 */
export default function Edit() {
	return (
		<div { ...useBlockProps() }>
			{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid */ }
			<a
				className="qp-edit-post__link"
				href="#"
				onClick={ ( e ) => e.preventDefault() }
				aria-disabled="true"
			>
				{ __( 'Edit', 'quickpostr' ) }
			</a>
		</div>
	);
}
