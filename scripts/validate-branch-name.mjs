import { execSync } from 'node:child_process';

const allowedPrefixes = ['feature/', 'fix/', 'chore/', 'refactor/', 'docs/', 'test/'];

function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

const branchName = getCurrentBranch();

if (!branchName || branchName === 'main' || branchName === 'master') {
  process.exit(0);
}

const isAllowed = allowedPrefixes.some((prefix) => branchName.startsWith(prefix));

if (!isAllowed) {
  console.error(
    `Branch "${branchName}" does not follow the repo convention. Use one of: ${allowedPrefixes.join(
      ', '
    )}`
  );
  process.exit(1);
}
