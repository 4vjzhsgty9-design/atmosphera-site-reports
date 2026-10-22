#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")/.."
version=2.75.0
case "$(uname -s)" in Linux) platform=linux;; Darwin) platform=darwin;; *) echo 'Use Linux, macOS or WSL2.' >&2;exit 1;; esac
case "$(uname -m)" in x86_64) architecture=amd64;; arm64|aarch64) architecture=arm64;; *) echo 'Unsupported architecture.' >&2;exit 1;; esac
artifact="supabase_${platform}_${architecture}.tar.gz"
task_dir="$(mktemp -d)"
trap 'rm -rf "$task_dir"' EXIT
base="https://github.com/supabase/cli/releases/download/v${version}"
curl --fail --silent --show-error --location "$base/supabase_${version}_checksums.txt" --output "$task_dir/checksums.txt"
curl --fail --silent --show-error --location "$base/$artifact" --output "$task_dir/$artifact"
# Do not execute anything until the checksum from the official release matches.
python3 - "$task_dir" "$artifact" <<'PY'
import hashlib,sys
from pathlib import Path
root=Path(sys.argv[1]); name=sys.argv[2]
expected=next(line.split()[0] for line in (root/'checksums.txt').read_text().splitlines() if line.split()[-1]==name)
if hashlib.sha256((root/name).read_bytes()).hexdigest()!=expected: raise SystemExit('Checksum mismatch. Installation stopped.')
PY
mkdir -p .tools
tar -xzf "$task_dir/$artifact" -C .tools supabase
.tools/supabase --version
