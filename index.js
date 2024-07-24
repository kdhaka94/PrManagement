import { Octokit } from "@octokit/rest";
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';

let repos = [];

// Load repos from file
if (fs.existsSync('repos.json')) {
  repos = JSON.parse(fs.readFileSync('repos.json'));
}

// Create a personal access token at https://github.com/settings/tokens
const octokit = new Octokit({ auth: `YOUR_GITHUB_TOKEN` });

const getPullRequestsOpenMoreThanMonth = async (owner, repo) => {
  try {
    let allPulls = [];
    let page = 1;
    const per_page = 100;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    while (true) {
      const response = await octokit.pulls.list({
        owner,
        repo,
        state: 'open',
        per_page,
        page,
      });

      const oldPulls = response.data.filter(pr => new Date(pr.created_at) < oneMonthAgo);
      allPulls = allPulls.concat(oldPulls);

      if (response.data.length < per_page) {
        break;
      }

      page++;
    }

    console.log(`Pull requests open for more than a month: ${allPulls.length}`);

    for (let pr of allPulls) {
      const daysOpen = Math.floor((new Date() - new Date(pr.created_at)) / (1000 * 60 * 60 * 24));
      
      console.log(
        `PR: ${chalk.green(pr.html_url)} - ` +
        `Branch: ${chalk.blue(pr.head.ref)} - ` +
        `Owner: ${chalk.yellow(pr.user.login)} - ` +
        `Open for ${chalk.red(daysOpen)} days`
      );
    }

    if (allPulls.length > 0) {
      const { shouldCloseAll } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldCloseAll',
          message: 'Do you want to close all these pull requests?',
          default: false,
        },
      ]);

      if (shouldCloseAll) {
        for (let pr of allPulls) {
          await closePullRequest(owner, repo, pr.number);
        }
      } else {
        console.log(chalk.yellow(`Skipped closing all PRs`));
      }
    }

  } catch (error) {
    console.error('Error fetching pull requests:', error);
  }
};

const closePullRequest = async (owner, repo, pull_number) => {
  try {
    await octokit.pulls.update({
      owner,
      repo,
      pull_number,
      state: 'closed'
    });
    console.log(chalk.green(`Successfully closed PR #${pull_number}`));
  } catch (error) {
    console.error(chalk.red(`Error closing PR #${pull_number}:`, error));
  }
};

const main = async () => {
  const { repo } = await inquirer.prompt([
    {
      type: 'list',
      name: 'repo',
      message: 'Which repo do you want to check?',
      choices: [...repos, new inquirer.Separator(), 'Add new repo', 'Check all repos'],
    },
  ]);

  if (repo === 'Add new repo') {
    const { newRepo } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newRepo',
        message: 'Enter the URL of the new repo:',
      },
    ]);

    repos.push(newRepo);
    // Save repos to file
    fs.writeFileSync('repos.json', JSON.stringify(repos));
    const [, , , owner, repoName] = newRepo.split('/');
    await getPullRequestsOpenMoreThanMonth(owner, repoName);
  } else if (repo === 'Check all repos') {
    for (let repoUrl of repos) {
      const [, , , owner, repoName] = repoUrl.split('/');
      await getPullRequestsOpenMoreThanMonth(owner, repoName);
    }
  } else {
    const [, , , owner, repoName] = repo.split('/');
    await getPullRequestsOpenMoreThanMonth(owner, repoName);
  }

  const { shouldContinue } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldContinue',
      message: 'Do you want to check another repo?',
      default: false,
    },
  ]);

  return shouldContinue;
}

const run = async () => {
  let continueRunning = true;
  while (continueRunning) {
    continueRunning = await main();
  }
}

run();