/**
 * Block editor entry point.
 *
 * Registers the quickpostr/composer block type. This bundle is loaded only
 * in the block editor — React is provided by @wordpress/element (WP global).
 */
import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit.jsx';
import metadata from '../block.json';

registerBlockType( metadata.name, {
	edit: Edit,

	// Dynamic block — server renders via render.php.
	save: () => null,
} );
