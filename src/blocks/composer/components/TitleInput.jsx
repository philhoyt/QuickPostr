import { useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Optional post title, shown above the composer body.
 *
 * The placeholder is the auto-generated title QuickPostr would apply, updating
 * live as the content changes. So the field doubles as the preview the old
 * SlugPreview provided: leave it alone and you can still see what the post will
 * be called; type in it and you override that.
 *
 * An empty value means "no override" — the composer sends an empty title and
 * QuickPostr_Rest lets PHP generate the canonical one, exactly as before.
 *
 * Props:
 *   value     {string}   — the user's override, '' when untouched
 *   onChange  (value: string) => void
 *   autoTitle {string}   — what PHP will generate if the user types nothing
 *   disabled  {boolean}
 * @param {Object}   root0
 * @param {string}   root0.value
 * @param {Function} root0.onChange
 * @param {string}   root0.autoTitle
 * @param {boolean}  root0.disabled
 */
export default function TitleInput( {
	value,
	onChange,
	autoTitle,
	disabled = false,
} ) {
	const inputId = useId();

	return (
		<div className="qp-title-input">
			<label className="qp-visually-hidden" htmlFor={ inputId }>
				{ __( 'Post title (optional)', 'quickpostr' ) }
			</label>
			<input
				id={ inputId }
				type="text"
				className="qp-title-input__field"
				value={ value }
				disabled={ disabled }
				maxLength={ 200 }
				onChange={ ( event ) => onChange( event.target.value ) }
				placeholder={
					autoTitle || __( 'Add a title (optional)', 'quickpostr' )
				}
			/>
		</div>
	);
}
