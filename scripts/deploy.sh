#!/usr/bin/env bash
# Runs on the server (CI pipes it over SSH). Switches the web container to an
# image that is already loaded, waits until it answers, and rolls back to the
# previous image if it does not.
#
# Usage: bash deploy.sh <deploy path> <image tag>
set -Eeuo pipefail

deploy_path="$1"
tag="$2"
image="ilhamnadhif-portfolio"

cd "$deploy_path"
if [[ ! -s .env ]]; then
  echo "Missing $deploy_path/.env: create it first (see docs/DEPLOYMENT.md)." >&2
  exit 1
fi
mkdir -p data

# One deploy at a time.
exec 9>.deploy.lock
if ! flock --nonblock 9; then
  echo "Another deploy is still running on this server." >&2
  exit 1
fi

# WEB_PORT may be "3003" or "127.0.0.1:3000"; the health check needs the port.
port="$(sed -n 's/^WEB_PORT=//p' .env | tail -n 1)"
port="${port:-3000}"
port="${port##*:}"
previous="$(cat .deployed-tag 2>/dev/null || true)"

start() {
  IMAGE_TAG="$1" docker compose up --detach --no-build --remove-orphans web
}

healthy() {
  for _ in $(seq 1 30); do
    if curl --fail --silent --show-error --output /dev/null "http://127.0.0.1:${port}/en"; then
      return 0
    fi
    sleep 2
  done
  return 1
}

echo "Starting ${image}:${tag} (previous: ${previous:-none})"
start "$tag"

if healthy; then
  echo "$tag" >.deployed-tag
  docker tag "${image}:${tag}" "${image}:latest"
  # Keep the running image and the previous one for rollback. Only this
  # project's images are touched; other projects on the server are left alone.
  docker image ls "$image" --format '{{.Tag}}' |
    grep --invert-match --line-regexp --fixed-strings -e latest -e "$tag" -e "${previous:-none}" |
    xargs --no-run-if-empty -I{} docker image rm "${image}:{}" >/dev/null || true
  echo "Deployed ${tag} on port ${port}"
else
  echo "The new version did not answer on port ${port}. Last log lines:" >&2
  docker compose logs --tail 50 web >&2 || true
  if [[ -n "$previous" ]]; then
    echo "Rolling back to ${previous}" >&2
    start "$previous"
  fi
  exit 1
fi
