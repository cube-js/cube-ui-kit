const dedent = require('dedent');
const { context, GitHub } = require('@actions/github');

module.exports = async function setMessage({ header, body }) {
  const { payload, repo } = context;
  const pr = payload.pull_request;

  const token = process.env.GH_TOKEN;

  const octokit = new GitHub(token);

  const commentList = await octokit.paginate(
    'GET /repos/:owner/:repo/issues/:issue_number/comments',
    {
      ...repo,
      issue_number: pr.number,
    },
  );

  const commentBody = dedent`
    ${header}

    ${body}
  `;

  const comment = commentList.find((comment) =>
    comment.body.startsWith(header),
  );

  if (!comment) {
    await octokit.issues.createComment({
      ...repo,
      issue_number: pr.number,
      body: commentBody,
    });
  } else {
    await octokit.issues.updateComment({
      ...repo,
      comment_id: comment.id,
      body: commentBody,
    });
  }
};
