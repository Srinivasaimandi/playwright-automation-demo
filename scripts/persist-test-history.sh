#!/usr/bin/env bash
set -euo pipefail

history_file="${PLAYWRIGHT_HISTORY_FILE:-.playwright-history/history.json}"
history_branch="${PLAYWRIGHT_HISTORY_BRANCH:-test-history}"
history_ref="refs/heads/${history_branch}"

if [[ ! -s "$history_file" ]]; then
  echo "No cumulative history file to persist."
  exit 0
fi

if git ls-remote --exit-code --heads origin "$history_ref" >/dev/null 2>&1; then
  git fetch --no-tags origin "$history_ref"
else
  empty_tree="$(git mktree </dev/null)"
  initial_commit="$(printf '%s\n' 'Initialize Playwright test history' | git -c user.name='github-actions[bot]' -c user.email='41898282+github-actions[bot]@users.noreply.github.com' commit-tree "$empty_tree")"
  git push origin "${initial_commit}:${history_ref}"
  git fetch --no-tags origin "$history_ref"
fi

worktree_root="$(mktemp -d)"
worktree_path="${worktree_root}/repository"
cleanup() {
  git worktree remove --force "$worktree_path" >/dev/null 2>&1 || true
  rmdir "$worktree_root" 2>/dev/null || true
}
trap cleanup EXIT

git worktree add --detach "$worktree_path" FETCH_HEAD
cp "$history_file" "${worktree_path}/history.json"
git -C "$worktree_path" config user.name 'github-actions[bot]'
git -C "$worktree_path" config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git -C "$worktree_path" add history.json

if git -C "$worktree_path" diff --cached --quiet; then
  echo "Cumulative history is unchanged."
  exit 0
fi

git -C "$worktree_path" commit -m 'Update cumulative Playwright test history'
git -C "$worktree_path" push origin "HEAD:${history_ref}"
