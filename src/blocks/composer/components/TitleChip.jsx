import { useId, useRef, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Optional post title, as a chip in the composer's meta bar.
 *
 * The chip label doubles as the title preview the old inline field provided:
 * with no override it shows the title QuickPostr would generate, updating live
 * as the content changes. Type in the panel and you override that.
 *
 * An empty value means "no override" — the composer sends an empty title and
 * QuickPostr_Rest lets PHP generate the canonical one, exactly as before.
 *
 * Props:
 *   value     {string}   — the user's override, '' when untouched
 *   onChange  (value: string) => void
 *   autoTitle {string}   — what PHP will generate if the user types nothing
 *   disabled  {boolean}
 *   isOpen    {boolean}  — whether this chip's panel is the open one
 *   onToggle  () => void
 * @param {Object}   root0
 * @param {string}   root0.value
 * @param {Function} root0.onChange
 * @param {string}   root0.autoTitle
 * @param {boolean}  root0.disabled
 * @param {boolean}  root0.isOpen
 * @param {Function} root0.onToggle
 */
export default function TitleChip( {
	value,
	onChange,
	autoTitle,
	disabled = false,
	isOpen = false,
	onToggle,
} ) {
	const inputId = useId();
	const panelId = useId();
	const inputRef = useRef( null );
	const toggleRef = useRef( null );

	// Keyed on `isOpen` alone so typing in the field never re-fires the focus.
	useEffect( () => {
		if ( isOpen ) {
			inputRef.current?.focus();
		}
	}, [ isOpen ] );

	function handleClear() {
		onChange( '' );
		toggleRef.current?.focus();
	}

	function handleKeyDown( event ) {
		if ( event.key === 'Escape' && isOpen ) {
			event.stopPropagation();
			onToggle?.();
			toggleRef.current?.focus();
		}
		// The chip sits outside the composer's form, so Enter has nothing to
		// submit — treat it as "done editing" instead. Scoped to the field:
		// on the toggle itself, Enter is already a click, and closing here
		// would let that click reopen the panel straight away.
		if (
			event.key === 'Enter' &&
			isOpen &&
			event.target === inputRef.current
		) {
			event.preventDefault();
			onToggle?.();
			toggleRef.current?.focus();
		}
	}

	const hasOverride = !! value.trim();
	const label =
		value.trim() || autoTitle || __( 'Title', 'quickpostr' );

	return (
		<div
			className={ `qp-chip qp-chip--title${
				isOpen ? ' qp-chip--open' : ''
			}` }
			onKeyDown={ handleKeyDown }
		>
			<div className="qp-chip__header">
				<button
					type="button"
					ref={ toggleRef }
					className={ `qp-chip__toggle${
						hasOverride ? ' qp-chip__toggle--set' : ''
					}` }
					onClick={ onToggle }
					disabled={ disabled }
					aria-expanded={ isOpen }
					aria-controls={ panelId }
					aria-label={
						hasOverride
							? sprintf(
									/* translators: %s: the post title the user typed. */
									__( 'Post title: %s. Change it.', 'quickpostr' ),
									label
							  )
							: __( 'Add a post title (optional)', 'quickpostr' )
					}
				>
					<svg
						className="qp-chip__icon qp-chip__icon--svg"
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M4 7h16M4 12h10M4 17h7" />
					</svg>
					<span className="qp-chip__label">{ label }</span>
				</button>
				{ hasOverride && (
					<button
						type="button"
						className="qp-chip__clear"
						onClick={ handleClear }
						aria-label={ __(
							'Use the automatic title',
							'quickpostr'
						) }
					>
						&#x2715;
					</button>
				) }
			</div>

			{ isOpen && (
				<div className="qp-chip__panel" id={ panelId }>
					<label className="qp-chip__panel-label" htmlFor={ inputId }>
						{ __( 'Post title (optional)', 'quickpostr' ) }
					</label>
					<div className="qp-chip__panel-row">
						<input
							id={ inputId }
							ref={ inputRef }
							type="text"
							className="qp-title-chip__input"
							value={ value }
							disabled={ disabled }
							maxLength={ 200 }
							onChange={ ( event ) =>
								onChange( event.target.value )
							}
							placeholder={
								autoTitle ||
								__( 'Add a title (optional)', 'quickpostr' )
							}
						/>
						{ hasOverride && (
							<button
								type="button"
								className="qp-chip__panel-action"
								onClick={ handleClear }
							>
								{ __( 'Use auto title', 'quickpostr' ) }
							</button>
						) }
					</div>
					<p className="qp-chip__hint">
						{ __(
							'Leave this empty and QuickPostr names the post for you.',
							'quickpostr'
						) }
					</p>
				</div>
			) }
		</div>
	);
}
