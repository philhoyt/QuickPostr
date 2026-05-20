import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import Edit from './edit.jsx';

registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
	save: () => null,
} );
