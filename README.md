# GitHub PR Checker and Closer

This script checks for pull requests that have been open for more than a month in specified GitHub repositories and provides an option to close them.

## Features

- Check multiple repositories for old pull requests
- Add new repositories to check
- Option to close all old pull requests at once
- Saves repository list for future use

## Prerequisites

- Node.js installed on your system
- A GitHub personal access token

## Installation

1. Clone this repository or download the script.
2. Run `npm install` to install the required dependencies:


## Configuration

Replace `YOUR_GITHUB_TOKEN` with your actual GitHub personal access token:
```javascript
const octokit = new Octokit({ auth: `YOUR_GITHUB_TOKEN` });