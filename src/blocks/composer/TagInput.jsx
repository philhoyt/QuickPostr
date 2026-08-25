import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	searchTags,
	createTag,
	getTag,
	getPopularTags,
	searchCategories,
	createCategory,
	getCategory,
	getPopularCategories,
} from './api.js';
import TermPicker from './components/TermPicker.jsx';

/**
 * Category + tag input with typeahead and inline creation.
 *
 * Both rows are the same TermPicker pointed at a different taxonomy.
 * Categories come first: they are the broad bucket a post belongs to, and a
 * default category is often pre-filled, so it reads top-down from the coarse
 * choice to the fine one.
 *
 * Props:
 *   selectedTags       {number[]}  — array of tag IDs
 *   selectedCategories {number[]}  — array of category IDs
 *   onTagsChange       (ids) => void
 *   onCategoriesChange (ids) => void
 * @param {Object}   root0
 * @param {number[]} root0.selectedTags
 * @param {number[]} root0.selectedCategories
 * @param {Function} root0.onTagsChange
 * @param {Function} root0.onCategoriesChange
 */
export default function TagInput( {
	selectedTags,
	selectedCategories,
	onTagsChange,
	onCategoriesChange,
} ) {
	// Stable identities: TermPicker's mount effect depends on getPopular.
	const categoryApi = useMemo(
		() => ( {
			search: searchCategories,
			create: createCategory,
			get: getCategory,
			getPopular: getPopularCategories,
		} ),
		[]
	);
	const tagApi = useMemo(
		() => ( {
			search: searchTags,
			create: createTag,
			get: getTag,
			getPopular: getPopularTags,
		} ),
		[]
	);

	return (
		<div className="qp-tag-input">
			<TermPicker
				selected={ selectedCategories }
				onChange={ onCategoriesChange }
				api={ categoryApi }
				chipModifier=" qp-tag-input__tag--cat"
				labels={ {
					placeholder: __( 'Add categories…', 'quickpostr' ),
					searchLabel: __( 'Search categories', 'quickpostr' ),
					/* translators: %s: category name */
					removeLabel: __( 'Remove category %s', 'quickpostr' ),
				} }
			/>

			<TermPicker
				selected={ selectedTags }
				onChange={ onTagsChange }
				api={ tagApi }
				labels={ {
					placeholder: __( 'Add tags…', 'quickpostr' ),
					searchLabel: __( 'Search tags', 'quickpostr' ),
					/* translators: %s: tag name */
					removeLabel: __( 'Remove tag %s', 'quickpostr' ),
				} }
			/>
		</div>
	);
}
