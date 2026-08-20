import { useState, useRef, useEffect, useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
	const [ seeded, setSeeded ] = useState( '' );
	const inputRef = useRef( null );
	const inputId = useId();

	// Seed the input with the site's current time whenever the panel opens, so
	// the picker starts somewhere sensible without committing to a value.
	useEffect( () => {
		if ( expanded && ! value ) {
			setSeeded( siteNowLocalString() );
		}
	}, [ expanded, value ] );

	function handleToggle() {
		setExpanded( ( open ) => ! open );
	}

	function handleInput( event ) {
		// Only a real edit commits a value.
		onChange( event.target.value );
	}

	function handleReset() {
		onChange( '' );
		setSeeded( siteNowLocalString() );
		inputRef.current?.focus();
	}

	const hasCustomDate = !! value;
	const label = hasCustomDate
		? formatForDisplay( value )
		: __( 'Now', 'quickpostr' );
	const willSchedule = canSchedule && hasCustomDate && isFuture( value );

	return (
		<div className="qp-date-chip">
			<button
				type="button"
				className={ `qp-date-chip__toggle${
					hasCustomDate ? ' qp-date-chip__toggle--set' : ''
				}` }
				onClick={ handleToggle }
				aria-expanded={ expanded }
				aria-label={
					hasCustomDate
						? // translators: %s: the chosen post date and time.
						  __( 'Post date: %s. Change it.', 'quickpostr' ).replace(
								'%s',
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
						value={ value || seeded }
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
