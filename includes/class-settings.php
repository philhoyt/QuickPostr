<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName -- short name intentional; class is QuickPostr_Settings.
/**
 * Admin settings page for QuickPostr.
 *
 * @package QuickPostr
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class QuickPostr_Settings
 *
 * Registers the Settings > QuickPostr admin page and all settings fields.
 */
class QuickPostr_Settings {

	/**
	 * Option key used to store all settings.
	 */
	const OPTION_KEY = 'quickpostr_settings';

	/**
	 * Register hooks.
	 */
	public function init(): void {
		add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
	}

	/**
	 * Return plugin defaults.
	 *
	 * @return array<string, mixed>
	 */
	public static function defaults(): array {
		return array(
			'allowed_roles'         => array( 'administrator', 'editor', 'author' ),
			'default_status'        => 'publish',
			'default_category'      => 0,
			'show_slug_preview'     => true,
			'hide_admin_bar'        => true,
			'hide_admin_bar_admins' => false,
			'front_end_edit'        => true,
			'strip_exif'            => true,
		);
	}

	/**
	 * Return current settings merged with defaults.
	 *
	 * @return array<string, mixed>
	 */
	public static function get(): array {
		$saved = get_option( self::OPTION_KEY, array() );
		return wp_parse_args( $saved, self::defaults() );
	}

	/**
	 * Register the settings page under Settings menu.
	 */
	public function add_settings_page(): void {
		add_options_page(
			esc_html__( 'QuickPostr Settings', 'quickpostr' ),
			esc_html__( 'QuickPostr', 'quickpostr' ),
			'manage_options',
			'quickpostr',
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Register settings, sections, and fields via the WP Settings API.
	 */
	public function register_settings(): void {
		register_setting(
			'quickpostr',
			self::OPTION_KEY,
			array(
				'sanitize_callback' => array( $this, 'sanitize_settings' ),
			)
		);

		add_settings_section(
			'quickpostr_general',
			esc_html__( 'General', 'quickpostr' ),
			'__return_empty_string',
			'quickpostr'
		);

		add_settings_field(
			'allowed_roles',
			esc_html__( 'Allowed Roles', 'quickpostr' ),
			array( $this, 'field_allowed_roles' ),
			'quickpostr',
			'quickpostr_general'
		);

		add_settings_field(
			'default_status',
			esc_html__( 'Default Post Status', 'quickpostr' ),
			array( $this, 'field_default_status' ),
			'quickpostr',
			'quickpostr_general'
		);

		add_settings_field(
			'default_category',
			esc_html__( 'Default Category', 'quickpostr' ),
			array( $this, 'field_default_category' ),
			'quickpostr',
			'quickpostr_general'
		);

		add_settings_field(
			'show_slug_preview',
			esc_html__( 'Show Slug Preview', 'quickpostr' ),
			array( $this, 'field_show_slug_preview' ),
			'quickpostr',
			'quickpostr_general'
		);

		add_settings_field(
			'hide_admin_bar',
			esc_html__( 'Hide Admin Bar', 'quickpostr' ),
			array( $this, 'field_hide_admin_bar' ),
			'quickpostr',
			'quickpostr_general'
		);

		add_settings_field(
			'hide_admin_bar_admins',
			esc_html__( 'Hide Admin Bar (Administrators)', 'quickpostr' ),
			array( $this, 'field_hide_admin_bar_admins' ),
			'quickpostr',
			'quickpostr_general'
		);

		add_settings_field(
			'front_end_edit',
			esc_html__( 'Front-End Post Management', 'quickpostr' ),
			array( $this, 'field_front_end_edit' ),
			'quickpostr',
			'quickpostr_general'
		);

		add_settings_field(
			'strip_exif',
			esc_html__( 'Strip Photo Metadata', 'quickpostr' ),
			array( $this, 'field_strip_exif' ),
			'quickpostr',
			'quickpostr_general'
		);
	}

	/**
	 * Sanitize and validate settings before saving.
	 *
	 * @param mixed $input Raw input from the form.
	 * @return array<string, mixed>
	 */
	public function sanitize_settings( mixed $input ): array {
		if ( ! is_array( $input ) ) {
			return self::defaults();
		}

		$defaults      = self::defaults();
		$valid_roles   = array_keys( wp_roles()->roles );
		$allowed_roles = array();

		if ( isset( $input['allowed_roles'] ) && is_array( $input['allowed_roles'] ) ) {
			foreach ( $input['allowed_roles'] as $role ) {
				if ( in_array( $role, $valid_roles, true ) ) {
					$allowed_roles[] = $role;
				}
			}
		}

		return array(
			'allowed_roles'         => $allowed_roles ? $allowed_roles : $defaults['allowed_roles'],
			'default_status'        => in_array( $input['default_status'] ?? '', array( 'publish', 'draft' ), true )
									? $input['default_status']
									: $defaults['default_status'],
			'default_category'      => absint( $input['default_category'] ?? 0 ),
			'show_slug_preview'     => ! empty( $input['show_slug_preview'] ),
			'hide_admin_bar'        => ! empty( $input['hide_admin_bar'] ),
			'hide_admin_bar_admins' => ! empty( $input['hide_admin_bar_admins'] ),
			'front_end_edit'        => ! empty( $input['front_end_edit'] ),
			'strip_exif'            => ! empty( $input['strip_exif'] ),
		);
	}

	// -------------------------------------------------------------------------
	// Field renderers
	// -------------------------------------------------------------------------

	/**
	 * Render the allowed_roles multicheck field.
	 */
	public function field_allowed_roles(): void {
		$settings  = self::get();
		$selected  = (array) $settings['allowed_roles'];
		$all_roles = wp_roles()->roles;

		foreach ( $all_roles as $role_key => $role_data ) {
			$checked = in_array( $role_key, $selected, true ) ? ' checked' : '';
			printf(
				'<label><input type="checkbox" name="%1$s[allowed_roles][]" value="%2$s"%3$s> %4$s</label><br>',
				esc_attr( self::OPTION_KEY ),
				esc_attr( $role_key ),
				esc_attr( $checked ),
				esc_html( translate_user_role( $role_data['name'] ) )
			);
		}
	}

	/**
	 * Render the default_status select field.
	 */
	public function field_default_status(): void {
		$settings = self::get();
		$current  = $settings['default_status'];
		$options  = array(
			'publish' => esc_html__( 'Published', 'quickpostr' ),
			'draft'   => esc_html__( 'Draft', 'quickpostr' ),
		);

		echo '<select name="' . esc_attr( self::OPTION_KEY ) . '[default_status]">';
		foreach ( $options as $value => $label ) {
			printf(
				'<option value="%1$s"%2$s>%3$s</option>',
				esc_attr( $value ),
				selected( $current, $value, false ),
				esc_html( $label )
			);
		}
		echo '</select>';
	}

	/**
	 * Render the default_category select field.
	 */
	public function field_default_category(): void {
		$settings = self::get();
		wp_dropdown_categories(
			array(
				'name'              => self::OPTION_KEY . '[default_category]',
				'selected'          => (int) $settings['default_category'],
				'show_option_none'  => esc_html__( '— Uncategorized —', 'quickpostr' ),
				'option_none_value' => 0,
				'hide_empty'        => false,
			)
		);
	}

	/**
	 * Render the show_slug_preview checkbox field.
	 */
	public function field_show_slug_preview(): void {
		$settings = self::get();
		printf(
			'<input type="checkbox" name="%1$s[show_slug_preview]" value="1"%2$s> <span class="description">%3$s</span>',
			esc_attr( self::OPTION_KEY ),
			checked( $settings['show_slug_preview'], true, false ),
			esc_html__( 'Show the auto-generated title preview below the composer input.', 'quickpostr' )
		);
	}

	/**
	 * Render the hide_admin_bar checkbox field.
	 */
	public function field_hide_admin_bar(): void {
		$settings = self::get();
		printf(
			'<input type="checkbox" name="%1$s[hide_admin_bar]" value="1"%2$s> <span class="description">%3$s</span>',
			esc_attr( self::OPTION_KEY ),
			checked( $settings['hide_admin_bar'], true, false ),
			esc_html__( 'Hide the WordPress admin bar for non-administrator roles.', 'quickpostr' )
		);
	}

	/**
	 * Render the hide_admin_bar_admins checkbox field.
	 */
	public function field_hide_admin_bar_admins(): void {
		$settings = self::get();
		printf(
			'<input type="checkbox" name="%1$s[hide_admin_bar_admins]" value="1"%2$s> <span class="description">%3$s</span>',
			esc_attr( self::OPTION_KEY ),
			checked( $settings['hide_admin_bar_admins'], true, false ),
			esc_html__( 'Also hide the WordPress admin bar for administrators.', 'quickpostr' )
		);
	}

	/**
	 * Render the front_end_edit checkbox field.
	 */
	public function field_front_end_edit(): void {
		$settings = self::get();
		printf(
			'<input type="checkbox" name="%1$s[front_end_edit]" value="1"%2$s> <span class="description">%3$s</span>',
			esc_attr( self::OPTION_KEY ),
			checked( $settings['front_end_edit'], true, false ),
			esc_html__( 'Allow post editing and deletion from the front end.', 'quickpostr' )
		);
	}

	/**
	 * Render the strip_exif checkbox field.
	 */
	public function field_strip_exif(): void {
		$settings = self::get();
		printf(
			'<input type="checkbox" name="%1$s[strip_exif]" value="1"%2$s> <span class="description">%3$s</span>',
			esc_attr( self::OPTION_KEY ),
			checked( $settings['strip_exif'], true, false ),
			esc_html__( 'Strip EXIF metadata (GPS, camera info) from uploaded images. Requires the Imagick PHP extension.', 'quickpostr' )
		);
	}

	/**
	 * Render the full settings page.
	 */
	public function render_settings_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form method="post" action="options.php">
				<?php
				settings_fields( 'quickpostr' );
				do_settings_sections( 'quickpostr' );
				submit_button();
				?>
			</form>

			<hr>
			<h2><?php esc_html_e( 'Companion Plugins', 'quickpostr' ); ?></h2>

			<?php if ( function_exists( 'geo_tagr_get_post_meta' ) ) : ?>
			<div class="notice notice-success inline" style="margin:0 0 8px">
				<p>
					<strong><?php esc_html_e( 'GeoTagr', 'quickpostr' ); ?></strong>
					&mdash;
					<?php esc_html_e( 'Active. Users can tag a location on their posts from the composer.', 'quickpostr' ); ?>
				</p>
			</div>
			<?php else : ?>
			<div class="notice notice-info inline" style="margin:0 0 8px">
				<p>
					<strong><?php esc_html_e( 'GeoTagr', 'quickpostr' ); ?></strong>
					&mdash;
					<?php
					printf(
						/* translators: %s: link to GeoTagr releases page */
						esc_html__( 'Install and activate %s to let users tag a location on their posts directly from the composer.', 'quickpostr' ),
						'<a href="https://github.com/philhoyt/geotagr/releases/latest" target="_blank" rel="noopener noreferrer">' . esc_html__( 'GeoTagr', 'quickpostr' ) . '</a>'
					);
					?>
				</p>
			</div>
			<?php endif; ?>

			<?php if ( class_exists( 'Better_Bookmarks' ) ) : ?>
			<div class="notice notice-success inline" style="margin:0">
				<p>
					<strong><?php esc_html_e( 'Better Bookmarks', 'quickpostr' ); ?></strong>
					&mdash;
					<?php esc_html_e( 'Active. The Link composer will display a rich preview card when users paste a URL.', 'quickpostr' ); ?>
				</p>
			</div>
			<?php else : ?>
			<div class="notice notice-info inline" style="margin:0">
				<p>
					<strong><?php esc_html_e( 'Better Bookmarks', 'quickpostr' ); ?></strong>
					&mdash;
					<?php
					printf(
						/* translators: %s: link to Better Bookmarks releases page */
						esc_html__( 'Install and activate %s to display a rich Open Graph preview card when users paste a URL in the Link composer.', 'quickpostr' ),
						'<a href="https://github.com/philhoyt/BetterBookmarks/releases/latest" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Better Bookmarks', 'quickpostr' ) . '</a>'
					);
					?>
				</p>
			</div>
			<?php endif; ?>
		</div>
		<?php
	}
}
