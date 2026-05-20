import { useBlockProps } from '@wordpress/block-editor';

/**
 * Editor preview for quickpostr/post-actions.
 * Shows a disabled kebab button — the real menu only renders on the front end.
 */
export default function Edit() {
	return (
		<div { ...useBlockProps() }>
			<button
				type="button"
				className="qp-post-actions__toggle"
				disabled
				aria-label="Post actions"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
				>
					<circle cx="12" cy="5" r="2" />
					<circle cx="12" cy="12" r="2" />
					<circle cx="12" cy="19" r="2" />
				</svg>
			</button>
		</div>
	);
}
