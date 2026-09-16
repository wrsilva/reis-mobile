# reis-mobile installer for Windows (PowerShell 5.1+).
#
#   irm https://raw.githubusercontent.com/wrsilva/reis-mobile/main/install.ps1 | iex
#
# Environment variables:
#   REIS_MOBILE_VERSION      Release tag to install (default: latest release)
#   REIS_MOBILE_HOME         Installation directory (default: %LOCALAPPDATA%\reis-mobile)
#   REIS_MOBILE_BIN_DIR      Directory for reis-mobile.cmd (default: %USERPROFILE%\.local\bin)
#   REIS_MOBILE_SKIP_PLUGIN  Set to 1 to skip installing the Claude Code plugin
#   REIS_MOBILE_LANG         Language the /reis-mobile commands answer in: en or pt
#   REIS_MOBILE_ARCHIVE_URL  Install from this archive (URL or local path) instead of a release
#
# Errors use `throw`, never `exit`: under `irm | iex` exit would close the user's session.

& {
  $ErrorActionPreference = 'Stop'
  $ProgressPreference = 'SilentlyContinue'

  $Repo = 'wrsilva/reis-mobile'
  $MinNodeMajor = 22
  $InstallRoot = if ($env:REIS_MOBILE_HOME) { $env:REIS_MOBILE_HOME } else { Join-Path $env:LOCALAPPDATA 'reis-mobile' }
  $BinDir = if ($env:REIS_MOBILE_BIN_DIR) { $env:REIS_MOBILE_BIN_DIR } else { Join-Path $HOME '.local\bin' }

  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "reis-mobile install: Node.js $MinNodeMajor+ is required (https://nodejs.org)."
  }
  $nodeMajor = [int](node -p "process.versions.node.split('.')[0]")
  if ($nodeMajor -lt $MinNodeMajor) {
    throw "reis-mobile install: Node.js $MinNodeMajor+ is required, found $(node --version)."
  }
  if (-not (Get-Command tar -ErrorAction SilentlyContinue)) {
    throw 'reis-mobile install: tar.exe is required (included in Windows 10 1803 and later).'
  }

  $tmp = Join-Path ([IO.Path]::GetTempPath()) ("reis-mobile-" + [guid]::NewGuid())
  New-Item -ItemType Directory -Path $tmp | Out-Null

  try {
    $archive = Join-Path $tmp 'reis-mobile.tar.gz'

    if ($env:REIS_MOBILE_ARCHIVE_URL) {
      Write-Host "Downloading $env:REIS_MOBILE_ARCHIVE_URL"
      if (Test-Path $env:REIS_MOBILE_ARCHIVE_URL) {
        Copy-Item $env:REIS_MOBILE_ARCHIVE_URL $archive
      } else {
        Invoke-WebRequest -UseBasicParsing -Uri $env:REIS_MOBILE_ARCHIVE_URL -OutFile $archive
      }
    } else {
      $version = $env:REIS_MOBILE_VERSION
      if (-not $version) {
        try {
          $version = (Invoke-RestMethod "https://api.github.com/repos/$Repo/releases/latest").tag_name
        } catch {
          throw "reis-mobile install: could not find a published release. Set REIS_MOBILE_VERSION or check https://github.com/$Repo/releases"
        }
      }

      $asset = "reis-mobile-$version.tar.gz"
      $baseUrl = "https://github.com/$Repo/releases/download/$version"
      Write-Host "Downloading reis-mobile $version"
      Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/$asset" -OutFile $archive
      $sums = Join-Path $tmp 'SHA256SUMS'
      Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/SHA256SUMS" -OutFile $sums

      $expected = Get-Content $sums |
        ForEach-Object { $parts = $_ -split '\s+'; if ($parts[1] -eq $asset) { $parts[0] } } |
        Select-Object -First 1
      if (-not $expected) { throw "reis-mobile install: SHA256SUMS has no entry for $asset" }
      $actual = (Get-FileHash $archive -Algorithm SHA256).Hash.ToLowerInvariant()
      if ($actual -ne $expected) { throw "reis-mobile install: checksum mismatch for $asset" }
    }

    $staging = Join-Path $tmp 'reis-mobile'
    New-Item -ItemType Directory -Path $staging | Out-Null
    tar -xzf $archive -C $staging --strip-components=1
    if ($LASTEXITCODE -ne 0) { throw 'reis-mobile install: could not extract the archive' }
    $entry = Join-Path $staging 'bin\reis-mobile.mjs'
    if (-not (Test-Path $entry)) { throw 'reis-mobile install: archive does not contain bin/reis-mobile.mjs' }

    $installedVersion = (Get-Content (Join-Path $staging 'package.json') -Raw | ConvertFrom-Json).version
    $versionDir = Join-Path $InstallRoot $installedVersion
    New-Item -ItemType Directory -Force -Path $InstallRoot, $BinDir | Out-Null
    if (Test-Path $versionDir) { Remove-Item $versionDir -Recurse -Force }
    Move-Item $staging $versionDir

    # Windows symlinks need admin or developer mode, so the shim points at the version directly.
    $shim = Join-Path $BinDir 'reis-mobile.cmd'
    $script = Join-Path $versionDir 'bin\reis-mobile.mjs'
    Set-Content -Path $shim -Encoding ASCII -Value "@echo off`r`nnode `"$script`" %*"
    Write-Host "Installed $(& $shim --version) to $versionDir"

    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if (-not (($userPath -split ';') -contains $BinDir)) {
      [Environment]::SetEnvironmentVariable('Path', (@($userPath, $BinDir) | Where-Object { $_ }) -join ';', 'User')
      $env:Path = "$env:Path;$BinDir"
      Write-Host "Added $BinDir to your user PATH. Open a new terminal to use reis-mobile."
    }

    if ($env:REIS_MOBILE_SKIP_PLUGIN -ne '1') {
      if (Get-Command claude -ErrorAction SilentlyContinue) {
        Write-Host 'Installing the Claude Code plugin'
        & $shim init
        if ($LASTEXITCODE -ne 0) { Write-Host "Plugin installation failed. Run 'reis-mobile init' to retry." }
      } else {
        Write-Host 'Claude Code not found. After installing it, run: reis-mobile init'
      }
    }

    Write-Host ''
    Write-Host 'Done. Verify with: reis-mobile --version'
  } finally {
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
  }
}
