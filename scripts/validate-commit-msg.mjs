import { readFileSync } from 'node:fs';

const commitMessageFile = process.argv[2];

if (!commitMessageFile) {
  process.exit(0);
}

const commitMessage = readFileSync(commitMessageFile, 'utf8').trim();
const conventionalCommitPattern =
  /^(feat|fix|chore|refactor|docs|test|style|perf|build|ci|revert)(\([^)]+\))?!?: .+/;

if (!conventionalCommitPattern.test(commitMessage)) {
  console.error(
    'Commit messages must follow Conventional Commits, for example: feat(payments): add review summary'
  );
  process.exit(1);
}
