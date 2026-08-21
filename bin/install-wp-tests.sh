#!/usr/bin/env bash
# Install the WordPress core test library so integration tests can run.
#
# Downloads WordPress core and the wordpress-develop PHPUnit harness, then
# writes a wp-tests-config.php pointing at a dedicated test database.
#
# WARNING: the test suite DROPS ALL TABLES in the database it is given on every
# run. Always point it at a throwaway database, never a real site's.
#
#   bin/install-wp-tests.sh <db-name> <db-user> <db-pass> [db-host] [wp-version]
#
# Local by Flywheel example (host is the mysqld socket path):
#   bin/install-wp-tests.sh quickpostr_tests root root \
#     "localhost:$HOME/Library/Application Support/Local/run/<id>/mysql/mysqld.sock" 7.1

set -euo pipefail

DB_NAME=${1:-}
DB_USER=${2:-}
DB_PASS=${3:-}
DB_HOST=${4:-localhost}
WP_VERSION=${5:-latest}

if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
	echo "usage: $0 <db-name> <db-user> <db-pass> [db-host] [wp-version]" >&2
	exit 1
fi

WP_TESTS_DIR=${WP_TESTS_DIR:-/tmp/wordpress-tests-lib}
WP_CORE_DIR=${WP_CORE_DIR:-/tmp/wordpress}

if [ "$WP_VERSION" = "latest" ]; then
	WP_VERSION=$(curl -s https://api.wordpress.org/core/version-check/1.7/ \
		| grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)
	echo "Resolved latest WordPress: $WP_VERSION"
fi

# WordPress core.
if [ ! -f "$WP_CORE_DIR/wp-settings.php" ]; then
	echo "Downloading WordPress $WP_VERSION..."
	mkdir -p "$WP_CORE_DIR"
	curl -sL "https://wordpress.org/wordpress-${WP_VERSION}.tar.gz" -o /tmp/wordpress.tar.gz
	tar --strip-components=1 -zxf /tmp/wordpress.tar.gz -C "$WP_CORE_DIR"
	rm -f /tmp/wordpress.tar.gz
else
	echo "WordPress core already present at $WP_CORE_DIR"
fi

# The PHPUnit harness lives in wordpress-develop, not in the release tarball.
if [ ! -d "$WP_TESTS_DIR/includes" ]; then
	echo "Downloading the test harness for $WP_VERSION..."
	mkdir -p "$WP_TESTS_DIR"
	TAG="tags/${WP_VERSION}"
	svn export --quiet --force "https://develop.svn.wordpress.org/${TAG}/tests/phpunit/includes/" "$WP_TESTS_DIR/includes"
	svn export --quiet --force "https://develop.svn.wordpress.org/${TAG}/tests/phpunit/data/" "$WP_TESTS_DIR/data"
else
	echo "Test harness already present at $WP_TESTS_DIR"
fi

# Config. Rewritten every run so credentials stay in step.
cat > "$WP_TESTS_DIR/wp-tests-config.php" <<PHPEOF
<?php
define( 'ABSPATH', '${WP_CORE_DIR}/' );
define( 'WP_TESTS_DOMAIN', 'example.org' );
define( 'WP_TESTS_EMAIL', 'admin@example.org' );
define( 'WP_TESTS_TITLE', 'QuickPostr Test Suite' );
define( 'WP_PHP_BINARY', 'php' );
define( 'WPLANG', '' );

define( 'DB_NAME', '${DB_NAME}' );
define( 'DB_USER', '${DB_USER}' );
define( 'DB_PASSWORD', '${DB_PASS}' );
define( 'DB_HOST', '${DB_HOST}' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

\$table_prefix = 'wptests_';

define( 'WP_DEBUG', true );
PHPEOF

echo "Wrote $WP_TESTS_DIR/wp-tests-config.php"
echo "Done. Run: composer test:integration"
