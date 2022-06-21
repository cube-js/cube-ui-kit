# Contribution guide

## Development Information

### Requirements

- [Node LTS](https://nodejs.org/en/)
- [YARN v1](https://classic.yarnpkg.com/lang/en/)

### Commit Convention

Before you create a Pull Request, please check whether your commits comply with
the commit conventions used in this repository.

When you create a commit, we kindly ask you to follow the convention
`category: message` in your commit message while using one of
the following categories:

- `feat/feature`: all changes that introduce completely new code or new
  features
- `fix`: changes that fix a bug (ideally, you will additionally reference an
  issue if present)
- `refactor`: any code-related change that is not a fix nor a feature
- `docs`: changing existing or creating new documentation (i.e. README, docs for
  usage of lib or CLI usage)
- `build`: all changes regarding the build of the software, changes to
  dependencies or the addition of new dependencies
- `test`: all changes regarding tests (adding new tests or changing existing
  ones)
- `ci`: all changes regarding the configuration of continuous integration (i.e.
  GitHub actions, ci system)
- `chore`: all changes to the repository that do not fit into any of the above
  categories

If you are interested in the detailed specification, you can visit
https://www.conventionalcommits.org/ or check out the
[Angular Commit Message Guidelines](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines).

### Steps to PR

1. Create a new branch out of the `main` branch. We follow the convention
   `[type/(task-name | scope)]`. For example `fix/CUK-1` or `docs/menu-typo`. `type`
   can be either `docs`, `fix`, `feat`, `build`, or any other conventional
   commit type. `scope` is just a short id that describes the scope of work.
2. Make and commit your changes following the
   [commit convention](https://github.com/cube-js/cube-ui-kit/blob/main/CONTRIBUTING.md#commit-convention).
   As you develop, you can run `yarn build` and
   `yarn test` to make sure everything works as expected.
3. Run `yarn changeset` to create a detailed description of your changes. This
   will be used to generate a changelog when we publish an update.
   [Learn more about Changeset](https://github.com/atlassian/changesets/tree/master/packages/cli).
   > You can make it earlier after you have created a PR.
   > Click on a link in the Changeset's bot message
   >  and write the changes you want to make. Then commit these changes.

4. Also, if you provide `jsx` snippets to the changeset, please turn off the
   live preview by doing the following at the beginning of the snippet:
   ` ```jsx live=false`

> If you made minor changes like CI config, prettier, etc, you can run
> `yarn changeset add --empty` to generate an empty changeset file to document
> your changes.

### Tests

All commits that fix bugs or add features need a test.
We use jest to write unit tests and storybook to make visual regression tests.
