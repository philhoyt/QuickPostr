import { useState, useRef, useId, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	siteNowLocalString,
	formatForDisplay,
	isFuture,
} from '../postDate.js';

/**
 * Post date chip — collapsed to "Now" until the user picks a date.
 *
 * The distinction that matters: `value` stays '' until the user actually edits
 * the input. Expanding the chip seeds the input for display only, so someone who
 * opens it, looks, and closes it again sends no `date` param at all and the post
 * is timestamped by WordPress exactly as before.
 *
 * Open state is owned by the composer so only one chip panel is ever open —
 * the panels are absolutely positioned over the same strip and would otherwise
 * overlap each other.
 *
 * Props:
 *   value    {string}   — '' for "now", otherwise a datetime-local value
 *   onChange (value: string) => void
 *   canSchedule {boolean} — whether a future date would actually schedule the
 *                           post. False when the composer saves drafts, since a
 *                           draft with a future date is not scheduled.
 *   isOpen   {boolean}  — whether this chip's panel is the open one
 *   onToggle () => void — ask the composer to open/close this chip
 * @param {Object}   root0
 * @param {string}   root0.value
 * @param {Function} root0.onChange
 * @param {boolean}  root0.canSchedule
 * @param {boolean}  root0.isOpen
 * @param {Function} root0.onToggle
 */
export default function DateChip( {
	value,
	onChange,
	canSchedule = true,
	isOpen = false,
	onToggle,
} ) {
	// What the input displays. Kept separate from `value` because a
	// datetime-local reports '' for any incomplete state: mid-edit, or with a
	// segment cleared. Feeding that back as the input's value would snap the
	// field back to "now" under the user's cursor on every such keystroke.
	const [ draft, setDraft ] = useState( '' );
	const inputRef = useRef( null );
	const toggleRef = useRef( null );
	const inputId = useId();
	const panelId = useId();

	// Move focus into the picker as the panel opens. Keyed on `isOpen` alone:
	// re-running it while the user types would drag the caret back to the first
	// segment of the datetime input on every keystroke.
	useEffect( () => {
		if ( isOpen ) {
			inputRef.current?.focus();
		}
	}, [ isOpen ] );

	function handleToggle() {
		// Seed the picker with the site's current time as the panel opens, so it
		// starts somewhere sensible without committing to a value. Done
		// synchronously rather than in an effect, which would seed a paint late
		// and flash an empty input.
		if ( ! isOpen ) {
			setDraft( value || siteNowLocalString() );
		}
		onToggle?.();
	}

	function handleInput( event ) {
		const next = event.target.value;
		// Always reflect what the user is doing, even mid-edit...
		setDraft( next );
		// ...but only a complete value commits a date. An incomplete one reads
		// as '' here, which means "no date param", i.e. post as now.
		onChange( next );
	}

	function handleReset() {
		setDraft( siteNowLocalString() );
		onChange( '' );
		toggleRef.current?.focus();
	}

	// Escape closes the panel without discarding what was already committed.
	function handleKeyDown( event ) {
		if ( event.key === 'Escape' && isOpen ) {
			event.stopPropagation();
			onToggle?.();
			toggleRef.current?.focus();
		}
	}

	const hasCustomDate = !! value;
	const label = hasCustomDate
		? formatForDisplay( value )
		: __( 'Now', 'quickpostr' );
	const willSchedule = canSchedule && hasCustomDate && isFuture( value );

	return (
		<div
			className={ `qp-chip qp-chip--date${
				isOpen ? ' qp-chip--open' : ''
			}` }
			onKeyDown={ handleKeyDown }
		>
			<div className="qp-chip__header">
				<button
					type="button"
					ref={ toggleRef }
					className={ `qp-chip__toggle${
						hasCustomDate ? ' qp-chip__toggle--set' : ''
					}` }
					onClick={ handleToggle }
					aria-expanded={ isOpen }
					aria-controls={ panelId }
					aria-label={
						hasCustomDate
							? sprintf(
									/* translators: %s: the chosen post date and time. */
									__( 'Post date: %s. Change it.', 'quickpostr' ),
									label
							  )
							: __( 'Set a post date. Currently now.', 'quickpostr' )
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
						<rect x="3" y="5" width="18" height="16" rx="2" />
						<path d="M3 10h18M8 3v4M16 3v4" />
					</svg>
					<span className="qp-chip__label">{ label }</span>
				</button>
				{ hasCustomDate && (
					<button
						type="button"
						className="qp-chip__clear"
						onClick={ handleReset }
						aria-label={ __( 'Reset post date to now', 'quickpostr' ) }
					>
						&#x2715;
					</button>
				) }
			</div>

			{ isOpen && (
				<div className="qp-chip__panel" id={ panelId }>
					<label
						className="qp-chip__panel-label"
						htmlFor={ inputId }
					>
						{ __( 'Post date and time', 'quickpostr' ) }
					</label>
					<div className="qp-chip__panel-row">
						<input
							id={ inputId }
							ref={ inputRef }
							type="datetime-local"
							className="qp-date-chip__input"
							value={ draft }
							onChange={ handleInput }
						/>
						{ hasCustomDate && (
							<button
								type="button"
								className="qp-chip__panel-action"
								onClick={ handleReset }
							>
								{ __( 'Reset to now', 'quickpostr' ) }
							</button>
						) }
					</div>
					{ willSchedule && (
						<p className="qp-chip__hint" role="status">
							{ __(
								'This post will be scheduled, not published immediately.',
								'quickpostr'
							) }
						</p>
					) }
				</div>
			) }
		</div>
	);
}
