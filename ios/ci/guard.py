"""Fail-closed provenance checks for manually approved GitHub releases."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.request

REPOSITORY = 'AprilNEA/Boji'
WORKFLOW = '.github/workflows/ios.yml'
TESTFLIGHT_JOBS = {'validate', 'build', 'release-gate', 'testflight'}


def github(path: str) -> dict:
    token = os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN')
    if not token:
        raise ValueError('Missing read-only GitHub token')
    request = urllib.request.Request(f'https://api.github.com/repos/{REPOSITORY}/{path}', headers={
        'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Boji-CI',
    })
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def trusted_dispatch(env: dict) -> None:
    if (env.get('GITHUB_REPOSITORY') != REPOSITORY or env.get('GITHUB_REF') != 'refs/heads/master'
            or env.get('GITHUB_EVENT_NAME') != 'workflow_dispatch'):
        raise ValueError('Release must be manually dispatched from AprilNEA/Boji master')
    if env.get('IOS_RELEASE_ENABLED') != 'true':
        raise ValueError('Configure protected environments before setting IOS_RELEASE_ENABLED=true')
    if env.get('RELEASE_ACTION') not in {'testflight', 'review'}:
        raise ValueError('Release requires an explicit testflight or review action')


def validate_run(run: dict, path: str, event: str, sha: str | None = None) -> None:
    if (run.get('path') != path or run.get('event') != event or run.get('head_branch') != 'master'
            or run.get('head_repository', {}).get('full_name') != REPOSITORY
            or run.get('status') != 'completed' or run.get('conclusion') != 'success'):
        raise ValueError('Source workflow must be a successful trusted master run')
    if sha is not None and run.get('head_sha') != sha:
        raise ValueError('Workflow source does not match the requested commit')


def require_testflight_jobs(run: dict) -> None:
    # A successful ci/review run now has the same workflow path. Require the
    # actual upload job and both CI jobs, not only the workflow conclusion.
    run_id, attempt = run.get('id'), run.get('run_attempt')
    if type(run_id) is not int or run_id < 1 or type(attempt) is not int or attempt < 1:
        raise ValueError('Invalid workflow run or attempt')
    result = github(f'actions/runs/{run_id}/attempts/{attempt}/jobs?per_page=100')
    jobs = result.get('jobs')
    if not isinstance(jobs, list) or result.get('total_count') != len(jobs):
        raise ValueError('Incomplete workflow job evidence')
    for name in TESTFLIGHT_JOBS:
        matches = [job for job in jobs if job.get('name') == name]
        if (len(matches) != 1 or matches[0].get('status') != 'completed'
                or matches[0].get('conclusion') != 'success'):
            raise ValueError('Source run must complete CI, release gate and TestFlight upload')


def testflight_run(run_id: str) -> dict:
    if not re.fullmatch(r'[1-9][0-9]*', run_id):
        raise ValueError('Invalid TestFlight workflow run ID')
    run = github(f'actions/runs/{run_id}')
    validate_run(run, WORKFLOW, 'workflow_dispatch')
    if run.get('id') != int(run_id):
        raise ValueError('Workflow run identity does not match the request')
    require_testflight_jobs(run)
    return run


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['dispatch', 'fetch-receipt'])
    parser.add_argument('--run-id')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    trusted_dispatch(os.environ)
    sha = os.environ.get('GITHUB_SHA', '')
    actual = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    if actual != sha:
        raise ValueError('Checkout is not the immutable workflow commit')
    if args.action == 'fetch-receipt':
        if not args.run_id or not args.output:
            raise ValueError('--run-id and --output are required')
        run = testflight_run(args.run_id)
        if args.output.exists():
            raise ValueError('Receipt directory must be new')
        args.output.mkdir(parents=True)
        # gh handles signed artifact redirects without forwarding our token to object storage.
        subprocess.run(['gh', 'run', 'download', args.run_id, '--repo', REPOSITORY,
                        '--name', 'ios-testflight-receipt', '--dir', str(args.output)], check=True)
        files = list(args.output.iterdir())
        if len(files) != 1 or files[0].name != 'receipt.json' or files[0].is_symlink():
            raise ValueError('Unexpected artifact contents')
        receipt = json.loads(files[0].read_text())
        if receipt.get('commit') != run['head_sha']:
            raise ValueError('Receipt was not produced for the source workflow commit')
        # Values are validated again by store.py before any Apple action.
        print(f"已验证 TestFlight 运行 {args.run_id} 的构建回执。")
    else:
        if subprocess.check_output(['git', 'status', '--porcelain'], text=True).strip():
            raise ValueError('Release requires a clean checkout')
        print('发布来源检查通过。')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, subprocess.SubprocessError):
        print('发布来源校验失败；检查 master、Environment 设置和同一提交的 CI 状态。', file=sys.stderr)
        sys.exit(1)
