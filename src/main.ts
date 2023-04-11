import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
  try {
    // Get client and context
    const client = github.getOctokit(
      core.getInput('repo-token', {required: true})
    );
    const context = github.context;

    // Do nothing if its not their first contribution
    console.log('Checking if its the users first contribution');
    if (!context.payload.sender) {
      throw new Error('Internal error, no sender provided by GitHub');
    }
    const sender: string = context.payload.sender!.login;
    const issue: {owner: string; repo: string; number: number} = context.issue;
    let firstContribution: boolean = false;
	firstContribution = await isFirstIssue(
	client,
	issue.owner,
	issue.repo,
	sender,
	issue.number
	);


	const time = new Date().toUTCString()
	const message = `${sender} forked this repo. The countdown starts at ${time}`
    // Add a comment to the appropriate place
    console.log(`Adding message: ${message} to ${issue.number}`);
	await client.rest.issues.create({
		title: `${sender}: fork`,
		owner: issue.owner,
		repo: issue.repo,
		body: message
	});
  } catch (error) {
    core.setFailed((error as any).message);
    return;
  }
}

async function isFirstIssue(
  client: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  sender: string,
  curIssueNumber: number
): Promise<boolean> {
  const {status, data: issues} = await client.rest.issues.listForRepo({
    owner: owner,
    repo: repo,
    creator: sender,
    state: 'all'
  });

  if (status !== 200) {
    throw new Error(`Received unexpected API status code ${status}`);
  }

  if (issues.length === 0) {
    return true;
  }

  for (const issue of issues) {
    if (issue.number < curIssueNumber && !issue.pull_request) {
      return false;
    }
  }

  return true;
}

run();
