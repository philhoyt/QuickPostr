<?php
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
			'allowed_roles'     => array( 'administrator', 'editor', 'author' ),
			'default_status'    => 'publish',
			'default_category'  => 0,
			'show_slug_preview' => true,
			'app_url_slug'      => 'quickpostr',
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
			'app_url_slug',
			esc_html__( 'App URL Slug', 'quickpostr' ),
			array( $this, 'field_app_url_slug' ),
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

		$old_slug = $defaults['app_url_slug'];
		$saved    = get_option( self::OPTION_KEY, array() );
		if ( isset( $saved['app_url_slug'] ) ) {
			$old_slug = sanitize_title( $saved['app_url_slug'] );
		}

		$new_slug = sanitize_title( $input['app_url_slug'] ?? 'quickpostr' ) ?: 'quickpostr';

		$sanitized = array(
			'allowed_roles'     => $allowed_roles ?: $defaults['allowed_roles'],
			'default_status'    => in_array( $input['default_status'] ?? '', array( 'publish', 'draft' ), true )
								   ? $input['default_status']
								   : $defaults['default_status'],
			'default_category'  => absint( $input['default_category'] ?? 0 ),
			'show_slug_preview' => ! empty( $input['show_slug_preview'] ),
			'app_url_slug'      => $new_slug,
		);

		// Flush rewrite rules if the slug changed.
		if ( $old_slug !== $new_slug ) {
			add_action( 'shutdown', 'flush_rewrite_rules' );
		}

		return $sanitized;
	}

	// -------------------------------------------------------------------------
	// Field renderers
	// -------------------------------------------------------------------------

	/**
	 * Render the allowed_roles multicheck field.
	 */
	public function field_allowed_roles(): void {
		$settings      = self::get();
		$selected      = (array) $settings['allowed_roles'];
		$all_roles     = wp_roles()->roles;

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
				'name'             => self::OPTION_KEY . '[default_category]',
				'selected'         => (int) $settings['default_category'],
				'show_option_none' => esc_html__( '— Uncategorized —', 'quickpostr' ),
				'option_none_value' => 0,
				'hide_empty'       => false,
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
	 * Render the app_url_slug text field.
	 */
	public function field_app_url_slug(): void {
		$settings = self::get();
		printf(
			'<input type="text" name="%1$s[app_url_slug]" value="%2$s" class="regular-text">
			<p class="description">%3$s <code>%4$s/%2$s</code></p>',
			esc_attr( self::OPTION_KEY ),
			esc_attr( $settings['app_url_slug'] ),
			esc_html__( 'The app will be available at', 'quickpostr' ),
			esc_url( home_url() )
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
		</div>
		<?php
	}
}
