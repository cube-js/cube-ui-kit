# add-changeset

Add changeset manually (direct edit / without cli commands). Place the changeset in the `/.changeset` folder.

## Version Selection
- Use `patch` for bug fixes and small changes (even with minor breaking changes)
- Use `minor` for new features and noticeable breaking changes

## Content Guidelines
- To analyze changes, use the following priority (unless user explicitly specifies what the changeset is for):
  1. Diff introduced in the current chat session
  2. Diff of the working tree (if chat diff is empty)
  3. Diff with the `main` branch (if working tree is empty)
- Check other changesets in case they can be edited instead of creating a new one
- Add several changesets instead of one if it makes sense
- Keep the changeset concise and user-focused
- Only document changes that affect end users or the public API
- Exclude fixes for issues that were introduced and resolved within the same PR (internal corrections during development)
