#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'Usage: %s [--dry-run]\n' "$(basename "$0")"
}

dry_run=false
case "${1:-}" in
  '') ;;
  --dry-run) dry_run=true ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"
upstream_remote="${UPSTREAM_REMOTE:-upstream}"

if ! git remote get-url "$upstream_remote" >/dev/null 2>&1; then
  printf 'ERROR: git remote %q is not configured. Add it with:\n' "$upstream_remote" >&2
  printf '  git remote add upstream https://github.com/Anionex/banana-slides.git\n' >&2
  exit 1
fi

if [[ "$dry_run" == false ]] && [[ -n "$(git status --porcelain)" ]]; then
  printf 'ERROR: working tree is not clean; commit or stash changes before syncing.\n' >&2
  exit 1
fi
printf 'Fetching tags from %s (%s)\n' "$upstream_remote" "$(git remote get-url "$upstream_remote")"
git fetch "$upstream_remote" --tags --prune

newest_tag="$(
  git ls-remote --tags --refs "$upstream_remote" 'refs/tags/v*' \
    | cut -f2 \
    | sed 's#^refs/tags/##' \
    | sort -V \
    | tail -n 1
)"
if [[ -z "$newest_tag" ]]; then
  printf 'ERROR: no upstream release tags matching v* were found.\n' >&2
  exit 1
fi

branch="$(git symbolic-ref --quiet --short HEAD || true)"
if [[ -z "$branch" ]]; then
  printf 'ERROR: sync requires a checked-out branch, not detached HEAD.\n' >&2
  exit 1
fi

printf 'Current branch: %s\n' "$branch"
printf 'Newest upstream release tag: %s\n' "$newest_tag"
if git merge-base --is-ancestor "$newest_tag" HEAD; then
  printf 'Upstream tag %s is already contained in HEAD; merge is a no-op.\n' "$newest_tag"
  merge_needed=false
else
  printf 'Upstream tag %s is not contained in HEAD; merge is required.\n' "$newest_tag"
  merge_needed=true
fi

if "$dry_run"; then
  if "$merge_needed"; then
    printf '[dry-run] Would merge %s into %s. FORK.md would record the tag after a successful merge.\n' "$newest_tag" "$branch"
  else
    printf '[dry-run] No merge and no FORK.md change required.\n'
  fi
  exit 0
fi

if "$merge_needed"; then
  if ! git merge --no-edit "$newest_tag"; then
    conflicted_files="$(git diff --name-only --diff-filter=U || true)"
    git merge --abort >/dev/null 2>&1 || true
    printf 'ERROR: merge of %s into %s was aborted.\n' "$newest_tag" "$branch" >&2
    if [[ -n "$conflicted_files" ]]; then
      printf 'Conflicted files:\n%s\n' "$conflicted_files" >&2
    else
      printf 'Git did not report unmerged paths; inspect the merge output above.\n' >&2
    fi
    printf 'Resolve on a fresh branch, preserve Phase 1 prompt/language behavior, then rerun this script.\n' >&2
    exit 1
  fi
fi

fork_doc="$repo_root/FORK.md"
temporary_doc="${fork_doc}.$$"
if [[ -f "$fork_doc" ]]; then
  existing_base="$(sed -n 's/^Synced upstream base:.*$/present/p' "$fork_doc" | sed -n '1p')"
  if [[ -n "$existing_base" ]]; then
    sed "s/^Synced upstream base:.*/Synced upstream base: \`$newest_tag\`/" "$fork_doc" > "$temporary_doc"
  else
    cat "$fork_doc" > "$temporary_doc"
    printf '\nSynced upstream base: `%s`\n' "$newest_tag" >> "$temporary_doc"
  fi
  mv "$temporary_doc" "$fork_doc"
else
  printf 'Synced upstream base: `%s`\n' "$newest_tag" > "$fork_doc"
fi
printf 'Recorded synced upstream base %s in FORK.md.\n' "$newest_tag"
