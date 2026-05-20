import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function Edit() {
	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			<p className="qp-media-gallery__editor-label">
				{ __(
					'Media Gallery is deprecated. Insert a core Gallery block and apply the "QuickPostr Slider" style instead.',
					'quickpostr'
				) }
			</p>
		</div>
	);
}
