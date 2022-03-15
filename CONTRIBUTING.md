# Contributing to UIKit for Cube Projects

Thanks for taking the time for contribution to UIKit for Cube Projects!
We're very welcoming community and while it's very much appreciated if you follow these guidelines it's not a requirement.

## Code of Conduct
This project and everyone participating in it is governed by the [UIKit for Cube Projects Code of Conduct](./CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@cube.dev.

## Contributing Code Changes

Please review the following sections before proposing code changes. 

### License

- UIKit for Cube Projects is [MIT licensed](./packages/cube-ui-kit/LICENSE).

### Developer Certificate of Origin (DCO)

By contributing to Cube Dev, Inc., You accept and agree to the terms and conditions in the [Developer Certificate of Origin](https://github.com/cube-js/cube.js/blob/master/DCO.md) for Your present and future Contributions submitted to Cube Dev, Inc. Your contribution includes any submissions to the [UIKit for Cube Projects repository](https://github.com/cube-js) when you click on such buttons as `Propose changes` or `Create pull request`. Except for the licenses granted herein, You reserve all right, title, and interest in and to Your Contributions.

## Step-by-step guide to contributing

1. Find [issues](https://github.com/cube-js/cube-ui-kit/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc) where we need help. Search for issues with either [`good first issue`](https://github.com/cube-js/cube.js/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3A%22good+first+issue%22+) and/or [`help wanted`](https://github.com/cube-js/cube.js/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3A%22help+wanted%22) labels.
2. Clone the [UIKit for Cube Projects repo](https://github.com/cube-js/cube-ui-kit).
3. Submit your Pull Request. 
4. Testing: Please include test(s) for your code contribution. See some of the test examples for [drivers](https://github.com/cube-js/cube.js/pull/1333/commits/56dadccd62ac4eaceafe650d2853406f5d3d9d43) and [backend](https://github.com/cube-js/cube.js/tree/master/packages/cubejs-backend-shared/test). 
5. Documentation: When new features are added or there are changes to existing features that require updates to documentation, we encourage you to add/update any missing documentation in the [`/docs` folder](https://github.com/cube-js/cube.js/tree/master/docs). To update an existing documentation page, you can simply click on the `Edit this page` button on the top right corner of the documentation page. 

## Development Workflow

### Prerequisites

UIKit for Cube Projects works with Node.js 10+ and uses Yarn as a package manager.

#### Development

1. After cloning UIKit for Cube Projects repository run `yarn install` to install dependencies.
2. Use `docker build -t cubejs/cube:dev -f dev.Dockerfile ../../` to build stable development image.

### UIKit for Cube Projects Client

1. After cloning UIKit for Cube Projects repository run `yarn install` in root directory.
2. Use `yarn link` to add these packages to link registry.
3. Perform required code changes.
4. Use `yarn build` in the repository root to build CommonJS and UMD modules.
5. Use `yarn link @cube-dev/ui-kit` in your project to test changes applied.
6. Use `yarn test` where available to test your changes.
7. Ensure that any CommonJS and UMD modules are included as part of your commit.

To get set up quickly, you can perform 1) and 2) with one line from the `ui-kit` clone root folder:

```
$ cd packages/cube-ui-kit && yarn && yarn link && cd ../..
```

## Publishing NPM package

1. Prepare all in branch `release/v*.*.*`
2. Create PR with name `chore(release): publish v*.*.*`
3. Run command `npm run release`
4. Commit and merge PR
5. Github Action automatically publish NPM package when see commit with message `chore(release): publish v*.*.*`

## Style guides

We're passionate about what code can do rather how it's formatted.
But in order to make code and docs maintainable following style guides will be enforced.
Following these guidelines is not a requirement, but you can save some time for maintainers if you apply those to your contribution beforehand.

### Code

1. Run `yarn lint` in package before committing your changes.
If package doesn't have lint script, please add it and run.
There's one root `.eslintrc.js` file for all packages except client ones.
Client packages has it's own `.eslintrc.js` files.
2. Run `yarn test` before committing if package has tests.
3. Please use [conventional commits name](https://www.conventionalcommits.org/) for your PR.
It'll be used to build change logs.
All PRs are merged using squash so only PR name matters.
4. Do not reformat code you aren't really changing unless it's absolutely necessary (e.g. fixing linter). Such changes make it really hard to use git blame feature when we need to find a commit where line change of interest was introduced.
