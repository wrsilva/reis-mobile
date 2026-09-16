#!/bin/sh
# reis-mobile installer for macOS and Linux.
#
#   curl -fsSL https://raw.githubusercontent.com/wrsilva/reis-mobile/main/install.sh | sh
#
# Environment variables:
#   REIS_MOBILE_VERSION      Release tag to install (default: latest release)
#   REIS_MOBILE_HOME         Installation directory (default: ~/.local/share/reis-mobile)
#   REIS_MOBILE_BIN_DIR      Directory for the reis-mobile command (default: ~/.local/bin)
#   REIS_MOBILE_SKIP_PLUGIN  Set to 1 to skip installing the Claude Code plugin
#   REIS_MOBILE_LANG         Language the /mobile commands answer in: en or pt
#   REIS_MOBILE_ARCHIVE_URL  Install from this archive instead of a GitHub release (testing)

set -eu

REPO="wrsilva/reis-mobile"
MIN_NODE_MAJOR=22
INSTALL_ROOT="${REIS_MOBILE_HOME:-$HOME/.local/share/reis-mobile}"
BIN_DIR="${REIS_MOBILE_BIN_DIR:-$HOME/.local/bin}"

say() { printf '%s\n' "$*"; }
fail() { printf 'reis-mobile install: %s\n' "$*" >&2; exit 1; }
has() { command -v "$1" >/dev/null 2>&1; }

check_requirements() {
  has curl || fail "curl is required"
  has tar || fail "tar is required"
  has node || fail "Node.js ${MIN_NODE_MAJOR}+ is required (https://nodejs.org). Install it and run this script again."

  node_major=$(node -p 'process.versions.node.split(".")[0]')
  [ "$node_major" -ge "$MIN_NODE_MAJOR" ] ||
    fail "Node.js ${MIN_NODE_MAJOR}+ is required, found $(node --version)"
}

resolve_version() {
  if [ -n "${REIS_MOBILE_VERSION:-}" ]; then
    VERSION="$REIS_MOBILE_VERSION"
    return
  fi
  VERSION=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null |
    sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -n 1) || true
  [ -n "$VERSION" ] || fail "could not find a published release. Set REIS_MOBILE_VERSION=<tag> or check https://github.com/${REPO}/releases"
}

sha256_of() {
  if has sha256sum; then
    sha256sum "$1" | cut -d ' ' -f 1
  elif has shasum; then
    shasum -a 256 "$1" | cut -d ' ' -f 1
  else
    fail "sha256sum or shasum is required to verify the download"
  fi
}

download() {
  archive="$TMP_DIR/reis-mobile.tar.gz"

  if [ -n "${REIS_MOBILE_ARCHIVE_URL:-}" ]; then
    say "Downloading ${REIS_MOBILE_ARCHIVE_URL}"
    curl -fsSL "$REIS_MOBILE_ARCHIVE_URL" -o "$archive" || fail "download failed"
    return
  fi

  asset="reis-mobile-${VERSION}.tar.gz"
  base_url="https://github.com/${REPO}/releases/download/${VERSION}"
  say "Downloading reis-mobile ${VERSION}"
  curl -fsSL "${base_url}/${asset}" -o "$archive" || fail "could not download ${base_url}/${asset}"
  curl -fsSL "${base_url}/SHA256SUMS" -o "$TMP_DIR/SHA256SUMS" || fail "could not download SHA256SUMS"

  expected=$(awk -v file="$asset" '$2 == file { print $1 }' "$TMP_DIR/SHA256SUMS")
  [ -n "$expected" ] || fail "SHA256SUMS has no entry for ${asset}"
  [ "$(sha256_of "$archive")" = "$expected" ] || fail "checksum mismatch for ${asset}"
}

install_files() {
  staging="$TMP_DIR/reis-mobile"
  mkdir -p "$staging"
  tar -xzf "$archive" -C "$staging" --strip-components=1
  [ -f "$staging/bin/reis-mobile.mjs" ] || fail "archive does not contain bin/reis-mobile.mjs"

  version_dir="$INSTALL_ROOT/$(node -p 'require(process.argv[1]).version' "$staging/package.json")"
  mkdir -p "$INSTALL_ROOT" "$BIN_DIR"
  rm -rf "$version_dir"
  mv "$staging" "$version_dir"
  ln -sfn "$version_dir" "$INSTALL_ROOT/current"
  chmod +x "$version_dir/bin/reis-mobile.mjs"
  ln -sf "$INSTALL_ROOT/current/bin/reis-mobile.mjs" "$BIN_DIR/reis-mobile"

  say "Installed $("$BIN_DIR/reis-mobile" --version) to ${version_dir}"
}

install_plugin() {
  if [ "${REIS_MOBILE_SKIP_PLUGIN:-0}" = "1" ]; then
    return
  fi
  if ! has claude; then
    say "Claude Code not found. After installing it, run: reis-mobile init"
    return
  fi
  say "Installing the Claude Code plugin"
  "$BIN_DIR/reis-mobile" init || say "Plugin installation failed. Run 'reis-mobile init' to retry."
}

print_path_hint() {
  case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *)
      say ""
      say "${BIN_DIR} is not in your PATH. Add it with:"
      say "  echo 'export PATH=\"${BIN_DIR}:\$PATH\"' >> ~/.zshrc   # or ~/.bashrc"
      ;;
  esac
}

main() {
  check_requirements
  [ -n "${REIS_MOBILE_ARCHIVE_URL:-}" ] || resolve_version

  TMP_DIR=$(mktemp -d)
  trap 'rm -rf "$TMP_DIR"' EXIT INT TERM

  download
  install_files
  install_plugin
  print_path_hint
  say ""
  say "Done. Verify with: reis-mobile --version"
}

main "$@"
