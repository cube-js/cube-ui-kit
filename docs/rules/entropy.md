# Entropy rule and Entropy review

**Project entropy is avoidable complexity that increases the effort required to understand, change or use the system.** In UI Kit, consider component maintainers, developers consuming the public API and people using the rendered controls. Entropy is an engineering metaphor, not a numeric score or a thermodynamic quantity.

## Entropy rule

Every task may introduce only complexity justified by its validated requirements. Prefer a safe reduction of complexity in the affected area when it helps deliver those requirements.

- Choose the simplest viable design that preserves correctness, accessibility, demonstrated performance needs and supported public contracts. Necessary complexity is valid; fewer lines, files, props or visible controls do not by themselves establish simplicity.
- Keep added concepts, state, configuration and special cases proportional to the capability delivered. Ask whether a materially simpler design satisfies the same requirements; task size and implementation time do not justify additional complexity.
- Put responsibility in its owning component or layer. Evaluate the whole affected path: moving work into another module, dependency, public API or every consumer does not by itself reduce complexity.
- Prefer existing patterns and implementations when their contracts fit. Do not force different contracts into one abstraction, invent speculative flexibility or add indirection merely to remove similar-looking code.
- Simplify safely within the task's scope. Preserve behavior and supported customization, and verify any refactoring using the applicable authoring and testing rules. Do not demand unrelated cleanup, a rewrite or removal of compatibility the task must preserve.
- Document any accepted avoidable complexity through the exception procedure below. An exception does not waive correctness, accessibility, security or public-contract requirements.

During implementation, identify the required capability and constraints before choosing a design. Before requesting review, be able to explain what complexity was added or removed, who bears its cost and why it is justified. Routine work needs no separate report or approval; put material tradeoffs and exceptions in the task record or PR description.

## Review signals

These signals guide investigation; none is an automatic violation.

| Signal | Code, APIs and consumer usage | UX |
| --- | --- | --- |
| Additional concepts | New abstractions, props or configuration modes that callers must understand. | New terminology, choices or interaction patterns that users must learn. |
| Fragmented responsibility | Duplicate sources of truth, parallel implementations or one change requiring coordinated edits in several places. | Multiple places to configure or perform the same operation. |
| Hidden rules | Implicit dependencies, event-order assumptions, surprising defaults or undocumented combinations of props. | Invisible prerequisites, surprising behavior or inconsistent defaults between comparable controls. |
| Extra work | A wrapper that exposes no useful boundary, or a new API that makes every consumer implement the same workaround. | Extra navigation, repeated input or remembering information between steps to complete one user goal. |
| Unnecessary flexibility | Options and extension points without an actual supported use case. | Rare choices competing with the common path without helping the intended user. |

For library changes, inspect supported overrides and representative callers as well as internals. An additional prop can simplify consumer code; an internal abstraction can increase it. Keep distinct contracts separate, and do not break the frozen legacy Form contract to make implementation smaller.

For UX, name the user goal and relevant audience. Compare the concepts, decisions, steps and information the user must remember before and after the change. Use familiar control semantics and expose complexity when it becomes useful. Hiding a frequently needed action or removing a helpful label can increase burden even when the screen looks simpler. Verify interaction, focus, keyboard behavior and layout through the shared review procedure where relevant; screenshots alone cannot prove task difficulty.

## Developer exceptions

A developer may explicitly accept a scoped complexity tradeoff in task instructions, a PR description or a PR comment. Agents may propose and document exceptions, and must honor an existing developer acceptance that covers the current change; they must not infer acceptance from silence or approve their own exception.

Possible reasons include a verified pre-existing UI Kit limitation, an upstream defect in Tasty or React Aria, a platform constraint, supported compatibility or an urgent fix where a broader change would add disproportionate risk. First consider a safe fix in the owning layer. A dependency issue or deadline alone does not automatically exempt the change.

Record:

- **Cause and evidence:** the concrete limitation or constraint; link an existing issue when available.
- **Alternative and cost:** the simpler design considered and why it cannot be used in this task.
- **Scope and acceptance:** the exact workaround or tradeoff accepted and the developer's acceptance reference.
- **Removal condition:** for a temporary workaround, the upstream fix, version or event that permits its removal. A permanent constraint needs a durable rationale rather than an invented cleanup promise.

For example: `Entropy exception accepted: keep the local adapter because dependency version X cannot express Y (issue link). It is limited to Z and can be removed when the supported dependency implements Y.` The developer posts or supplies the acceptance; an agent writing this sentence does not establish it.

An accepted exception covers only that tradeoff. Keep reviewing the rest of the change, and reassess any later expansion beyond the accepted scope. Where another repository rule requires a particular owner's acceptance, follow that rule too.

## Entropy review

Use [the shared review scope and verification procedure](review.md#verify-candidates-before-reporting). Review complexity introduced or amplified by the requested change, reading owners and callers for context without requiring migrations of untouched code.

1. Identify the validated requirements and constraints. If missing context prevents judging a design, state the uncertainty rather than inventing requirements or reporting a violation.
2. Identify added and removed complexity across implementation, public APIs, consumer usage and applicable UX. Assess each affected area; unrelated cleanup does not cancel an unjustified burden elsewhere.
3. For each candidate, name who bears the cost and a concrete maintenance or user scenario. Actively check whether the complexity is required, whether an existing abstraction really fits and whether a simpler alternative preserves the same requirements.
4. Check recorded developer exceptions before reporting. Respect accepted scope, and distinguish a proposed exception awaiting acceptance from an accepted one.
5. Report only established findings, using the shared review format. Each finding needs a file and line, the relevant rule, the concrete burden, evidence and the smallest verified improvement. When a tradeoff needs developer acceptance, describe it as a design decision awaiting acceptance rather than claiming a behavior defect.

Do not block a change with only “this increases entropy,” personal preference, raw counts or speculative future maintenance. Severity follows the demonstrated consequence. Drop refuted candidates; record material verification limits without claiming a pass for unexamined behavior.

A focused Entropy review states its scope/base and concludes `pass`, `changes needed`, `exception accepted` or `unverified`. Include verified findings, material accepted exceptions and any limits that affect the conclusion. Use `changes needed` while a confirmed avoidable burden remains unresolved or its proposed exception lacks developer acceptance; use `exception accepted` only when all remaining avoidable complexity is covered by recorded developer acceptance. Use `unverified` when missing context or evidence prevents a conclusion. In a broader UI Kit review, include entropy findings, material exceptions and verification limits with the other results; do not duplicate the report or list routine passed checks.

## Background

The policy applies established ideas to UI Kit; these sources motivate the rule rather than provide a formula for scoring changes.

- [Lehman's law of increasing complexity](https://users.ece.utexas.edu/~perry/work/papers/feast1.old.pdf): evolving software requires deliberate work to maintain or reduce complexity.
- [Brooks, No Silver Bullet](https://www.cs.unc.edu/techreports/86-020.pdf): distinguish difficulty inherent in the problem from difficulty in its implementation.
- [Ousterhout, The Nature of Complexity](https://web.stanford.edu/~ouster/cgi-bin/cs190-winter18/lecture.php?topic=complexity): investigate change amplification, cognitive load and hard-to-discover dependencies.
- [Sweller and colleagues, Cognitive Architecture and Instructional Design](https://link.springer.com/article/10.1007/s10648-019-09465-5): distinguish inherent learning difficulty from burden introduced by presentation. Applying that distinction to developer experience and UX is this policy's design interpretation.
