import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

const ALLOWED_BLOCKS = [ 'core/image' ];
const TEMPLATE = [
	[ 'core/image', {} ],
	[ 'core/image', {} ],
];

export default function Edit() {
	const blockProps = useBlockProps( { className: 'qp-media-gallery' } );

	return (
		<div { ...blockProps }>
			<p className="qp-media-gallery__editor-label">
				{ __(
					'Media Gallery — add photos using the Image block',
					'quickpostr'
				) }
			</p>
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				template={ TEMPLATE }
				templateLock={ false }
			/>
		</div>
	);
}
