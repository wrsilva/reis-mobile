#!/usr/bin/env node
// Renders the Homebrew formula for a published release.
//
//   node scripts/homebrew-formula.mjs v0.1.0 <sha256 of reis-mobile-v0.1.0.tar.gz>
//
// Copy the output to Formula/reis-mobile.rb in the wrsilva/homebrew-tap repository.
import { fileURLToPath } from 'node:url';

export function renderFormula({ tag, sha256 }) {
  if (!/^v\d+\.\d+\.\d+/.test(tag ?? '')) throw new Error(`Invalid tag "${tag}". Expected something like v0.1.0`);
  if (!/^[0-9a-f]{64}$/.test(sha256 ?? '')) throw new Error('Invalid sha256: expected 64 lowercase hex characters');

  return `class ReisMobile < Formula
  desc "AI agents, skills and workflows for mobile engineering"
  homepage "https://github.com/wrsilva/reis-mobile"
  url "https://github.com/wrsilva/reis-mobile/releases/download/${tag}/reis-mobile-${tag}.tar.gz"
  sha256 "${sha256}"
  license "MIT"

  depends_on "node"

  def install
    libexec.install Dir["*"], ".claude-plugin"
    (bin/"mobile").write_env_script libexec/"bin/mobile.mjs", PATH: "#{Formula["node"].opt_bin}:$PATH"
  end

  def caveats
    <<~EOS
      To add the mobile plugin to Claude Code, run:
        mobile init
    EOS
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/mobile --version")
    assert_match "stacks", shell_output("#{bin}/mobile validate")
  end
end
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [tag, sha256] = process.argv.slice(2);
  process.stdout.write(renderFormula({ tag, sha256 }));
}
