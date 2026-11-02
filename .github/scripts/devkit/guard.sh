#!/usr/bin/env bash
# devkit@v1 managed. Edit in renaissanceabc/devkit.
# Decide whether a pull request diff may squash-merge.
#
# Usage: guard.sh <unified-diff>
#
# Stdout is key=value lines:
#   guard=skip|pass
#   automerge=false|true
#   paths=<guarded paths, or ->
#   reason=<text>
#
# EXTRA_PATHS: newline-separated globs. A leading **/ is an optional directory prefix.
# PR_LABELS: newline-separated label names. needs-karel and "needs: hands" skip.
# Major bumps are paired the way flourish's guard pairs them. Lockfile-only diffs pass.
set -euo pipefail

if [ "$#" -eq 0 ] || [ "${1:-}" = "-" ]; then
  diff_file="$(mktemp)"
  cat >"$diff_file"
elif [ -f "$1" ]; then
  diff_file="$1"
else
  echo "guard=skip"
  echo "automerge=false"
  echo "paths=-"
  echo "reason=diff not readable"
  exit 0
fi

hits=()
current_file=""
m_file=()
m_key=()
m_maj=()
p_file=()
p_key=()
p_maj=()

add_hit() {
  local item="$1" existing
  if [ "${#hits[@]}" -gt 0 ]; then
    for existing in "${hits[@]}"; do
      [ "$existing" = "$item" ] && return 0
    done
  fi
  hits+=("$item")
}

glob_match() {
  local path="$1" pat="$2" re="" i=0 len c n
  if [[ "$pat" == \*\*/* ]]; then
    pat="${pat#\*\*/}"
    re="^(.*/)?"
  else
    re="^"
  fi
  len=${#pat}
  while [ "$i" -lt "$len" ]; do
    c="${pat:i:1}"
    n="${pat:i+1:1}"
    if [ "$c" = "*" ] && [ "$n" = "*" ]; then
      re="${re}.*"
      i=$((i + 2))
    elif [ "$c" = "*" ]; then
      re="${re}[^/]*"
      i=$((i + 1))
    else
      case "$c" in
        '.' | '\' | '+' | '?' | '^' | '$') re="${re}\\${c}" ;;
        *)
          if [ "$c" = "|" ] || [ "$c" = "(" ] || [ "$c" = ")" ]; then
            re="${re}\\${c}"
          else
            re="${re}${c}"
          fi
          ;;
      esac
      i=$((i + 1))
    fi
  done
  re="${re}$"
  [[ "$path" =~ $re ]]
}

match_extra() {
  local path="$1" pat
  [ -z "${EXTRA_PATHS:-}" ] && return 1
  while IFS= read -r pat || [ -n "$pat" ]; do
    [ -z "$pat" ] && continue
    if glob_match "$path" "$pat"; then
      return 0
    fi
  done <<<"$EXTRA_PATHS"
  return 1
}

normalize_diff_path() {
  local p="$1"
  p="${p%%$'\t'*}"
  if [ "${p#\"}" != "$p" ] && [ "${p%\"}" != "$p" ]; then
    p="${p#\"}"
    p="${p%\"}"
  fi
  case "$p" in
    a/*) p="${p#a/}" ;;
    b/*) p="${p#b/}" ;;
  esac
  printf '%s' "$p"
}

is_env_secret() {
  local base="$1"
  [ "$base" = ".env.example" ] && return 1
  [ "$base" = ".env" ] && return 0
  [[ "$base" == .env.* ]]
}

has_segment() {
  local path="$1" seg="$2"
  [[ "$path" == "$seg"/* || "$path" == */"$seg"/* ]]
}

consider_path() {
  local p="$1" base seg
  [ -z "$p" ] && return 0
  [ "$p" = "/dev/null" ] && return 0
  if [[ "$p" == .github || "$p" == .github/* ]]; then
    add_hit "$p"
    return 0
  fi
  if has_segment "$p" migrations; then
    add_hit "$p"
    return 0
  fi
  base="${p##*/}"
  if [ "$base" = "release-please-config.json" ] || [ "$base" = ".release-please-manifest.json" ]; then
    add_hit "$p"
    return 0
  fi
  for seg in auth billing stripe payments; do
    if has_segment "$p" "$seg"; then
      add_hit "$p"
      return 0
    fi
  done
  if is_env_secret "$base"; then
    add_hit "$p"
    return 0
  fi
  if match_extra "$p"; then
    add_hit "$p"
  fi
}

major_of() {
  local spec="$1"
  if ! [[ "$spec" =~ ^([~^*=<>]|>=|<=|workspace:|npm:|catalog:|file:|link:|github:|git|https?://|v?[0-9]|[A-Za-z0-9._+-]+@) ]]; then
    return 1
  fi
  if ! [[ "$spec" =~ ([0-9]+)\.[0-9]+ ]]; then
    return 1
  fi
  printf '%s' "${BASH_REMATCH[1]}"
}

push_ver() {
  local sign="$1" key="$2" maj="$3"
  if [ "$sign" = "-" ]; then
    m_file+=("$current_file")
    m_key+=("$key")
    m_maj+=("$maj")
  else
    p_file+=("$current_file")
    p_key+=("$key")
    p_maj+=("$maj")
  fi
}

record_json() {
  local sign="$1" raw="$2" key val maj
  [[ "$raw" =~ ^[[:space:]]*\"([^\"]+)\"[[:space:]]*:[[:space:]]*\"([^\"]*)\" ]] || return 0
  key="${BASH_REMATCH[1]}"
  val="${BASH_REMATCH[2]}"
  case "$key" in
    version | name | description | private | license | author | main | module | types | type) return 0 ;;
  esac
  maj="$(major_of "$val")" || return 0
  push_ver "$sign" "$key" "$maj"
}

record_swift() {
  local sign="$1" raw="$2" val key maj
  [[ "$raw" =~ from:[[:space:]]*\"([0-9]+\.[0-9]+[^\"]*)\" ]] || return 0
  val="${BASH_REMATCH[1]}"
  key="package"
  if [[ "$raw" =~ url:[[:space:]]*\"([^\"]+)\" ]]; then
    key="${BASH_REMATCH[1]}"
  fi
  maj="$(major_of "$val")" || return 0
  push_ver "$sign" "$key" "$maj"
}

record_line() {
  local sign="$1" raw="$2" base
  [ -z "$current_file" ] && return 0
  base="${current_file##*/}"
  if [ "$base" = "package.json" ]; then
    record_json "$sign" "$raw"
  elif [ "$base" = "Package.swift" ] || [ "$base" = "Project.swift" ]; then
    record_swift "$sign" "$raw"
  fi
}

compare_versions() {
  local i j n m
  n="${#m_key[@]}"
  m="${#p_key[@]}"
  if [ "$n" -eq 0 ] || [ "$m" -eq 0 ]; then
    return 0
  fi
  local -a used=()
  for ((j = 0; j < m; j++)); do
    used[j]=0
  done
  for ((i = 0; i < n; i++)); do
    for ((j = 0; j < m; j++)); do
      [ "${used[j]}" = 1 ] && continue
      if [ "${m_file[i]}" = "${p_file[j]}" ] && [ "${m_key[i]}" = "${p_key[j]}" ]; then
        used[j]=1
        if [ "${m_maj[i]}" != "${p_maj[j]}" ]; then
          add_hit "${m_file[i]} (${m_key[i]} ${m_maj[i]} -> ${p_maj[j]})"
        fi
        break
      fi
    done
  done
}

while IFS= read -r line || [ -n "${line:-}" ]; do
  if [[ "$line" == "diff --git "* ]]; then
    rest="${line#diff --git }"
    a_spec=""
    b_spec=""
    if [[ "$rest" == \"* ]]; then
      if [[ "$rest" =~ ^\"(.*)\"\ \"(.*)\"$ ]]; then
        a_spec="${BASH_REMATCH[1]}"
        b_spec="${BASH_REMATCH[2]}"
      fi
    else
      a_spec="${rest%% b/*}"
      b_spec="b/${rest#* b/}"
    fi
    a_path="$(normalize_diff_path "$a_spec")"
    b_path="$(normalize_diff_path "$b_spec")"
    consider_path "$a_path"
    consider_path "$b_path"
    if [ -n "$b_path" ] && [ "$b_path" != "/dev/null" ]; then
      current_file="$b_path"
    else
      current_file="$a_path"
    fi
    continue
  fi
  if [[ "$line" == "rename from "* ]]; then
    consider_path "${line#rename from }"
    continue
  fi
  if [[ "$line" == "rename to "* ]]; then
    consider_path "${line#rename to }"
    current_file="${line#rename to }"
    continue
  fi
  if [[ "$line" == "+++ "* ]]; then
    plus_path="$(normalize_diff_path "${line#+++ }")"
    if [ -n "$plus_path" ] && [ "$plus_path" != "/dev/null" ]; then
      current_file="$plus_path"
    fi
    continue
  fi
  case "$line" in
    ---*) continue ;;
    +*) record_line "+" "${line:1}" ;;
    -*) record_line "-" "${line:1}" ;;
  esac
done <"$diff_file"

compare_versions

label_blocked=0
if [ -n "${PR_LABELS:-}" ]; then
  while IFS= read -r name || [ -n "${name:-}" ]; do
    case "$name" in
      "needs-karel" | "needs: hands") label_blocked=1 ;;
    esac
  done <<<"$PR_LABELS"
fi

if [ "$label_blocked" = 1 ]; then
  echo "guard=skip"
  echo "automerge=false"
  echo "paths=-"
  echo "reason=labeled needs-karel or needs: hands"
  exit 0
fi

join_hits() {
  local out="" item
  for item in "${hits[@]}"; do
    if [ -n "$out" ]; then
      out="${out}, ${item}"
    else
      out="$item"
    fi
  done
  printf '%s' "$out"
}

if [ "${#hits[@]}" -eq 0 ]; then
  echo "guard=pass"
  echo "automerge=true"
  echo "paths=-"
  echo "reason=no guarded paths"
  exit 0
fi

joined="$(join_hits)"
echo "guard=skip"
echo "automerge=false"
echo "paths=${joined}"
echo "reason=guarded paths: ${joined}"
