import { useState, useRef, useId } from '@wordpress/element';
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
 * Props:
 *   value    {string}   — '' for "now", otherwise a datetime-local value
 *   onChange (value: string) => void
 *   canSchedule {boolean} — whether a future date would actually schedule the
 *                           post. False when the composer saves drafts, since a
 *                           draft with a future date is not scheduled.
 * @param {Object}   root0
 * @param {string}   root0.value
 * @param {Function} root0.onChange
 * @param {boolean}  root0.canSchedule
 */
export default function DateChip( { value, onChange, canSchedule = true } ) {
	const [ expanded, setExpanded ] = useState( false );

	// What the input displays. Kept separate from `value` because a
	// datetime-local reports '' for any incomplete state: mid-edit, or with a
	// segment cleared. Feeding that back as the input's value would snap the
	// field back to "now" under the user's cursor on every such keystroke.
	const [ draft, setDraft ] = useState( '' );
	const inputRef = useRef( null );
	const inputId = useId();

	function handleToggle() {
		// Seed the picker with the site's current time as the panel opens, so it
		// starts somewhere sensible without committing to a value. Done
		// synchronously rather than in an effect, which would seed a paint late
		// and flash an empty input.
		if ( ! expanded ) {
			setDraft( value || siteNowLocalString() );
		}
		setExpanded( ( open ) => ! open );
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
		inputRef.current?.focus();
	}

	const hasCustomDate = !! value;
	const label = hasCustomDate
		? formatForDisplay( value )
		: __( 'Now', 'quickpostr' );
	const willSchedule = canSchedule && hasCustomDate && isFuture( value );

	return (
		<div
			className={ `qp-date-chip${
				expanded ? ' qp-date-chip--open' : ''
			}` }
		>
			<button
				type="button"
				className={ `qp-date-chip__toggle${
					hasCustomDate ? ' qp-date-chip__toggle--set' : ''
				}` }
				onClick={ handleToggle }
				aria-expanded={ expanded }
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
				<span className="qp-date-chip__icon" aria-hidden="true">
					&#128197;
				</span>
				<span className="qp-date-chip__label">{ label }</span>
			</button>

			{ expanded && (
				<div className="qp-date-chip__panel">
					<label
						className="qp-date-chip__field-label"
						htmlFor={ inputId }
					>
						{ __( 'Post date and time', 'quickpostr' ) }
					</label>
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
							className="qp-date-chip__reset"
							onClick={ handleReset }
						>
							{ __( 'Reset to now', 'quickpostr' ) }
						</button>
					) }
					{ willSchedule && (
						<p className="qp-date-chip__hint" role="status">
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
