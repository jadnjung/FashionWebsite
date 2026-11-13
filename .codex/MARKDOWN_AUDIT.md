# Markdown audit

Reviewed the repository's 256 Markdown files on November 12, 2026. The audit covered structural validity, local references, skill metadata, project accuracy, and instructions that affect future agent work. Changes are limited to documentation.

## Coverage

| Scope | Files | Review |
| --- | ---: | --- |
| Root documents | 10 | Project facts, workflow, branch policy, precedence, links, and structure |
| Project plans and specifications under docs | 23 | References, structure, and consistency with their historical purpose |
| Claude setup backups | 3 | Restoring instructions, generic workflow, and skill metadata |
| Demo image manifest | 1 | Asset existence and consistency between the prose and image table |
| Original Claude configuration | 112 | Agent responsibilities, skill dependencies, local resources, and structure |
| Codex skill documentation | 103 | Invocation syntax, autonomy, metadata, resource locations, and technical guidance |
| Codex setup and migration reports | 2 | Current guidance versus installation snapshots |
| Bundled migrator documentation | 2 | Installation paths, provenance, and dated compatibility guidance |
| Total before adding this report | 256 | All files received structural checks and a review appropriate to their purpose |

The final structural check also includes this report. Installed dependency documentation under node_modules and Git internals are outside the repository-document audit.

## Corrections

- AGENTS.md now describes the standing commit-and-push authorization and identifies the source restrictions as belonging to the original migration task.
- README.md now includes Codex onboarding, Superpowers installation, isolated TypeScript tooling, and the branch-policy reference.
- ARCHITECTURE.md now identifies Tailwind 4, existing routes, current Klaviyo integration, the Demo Mode test suite, and planned commerce work accurately.
- PROJECT.md, DESIGN_SYSTEM.md, CONTENT.md, and INTERACTIONS.md explain where later decisions supersede the original access-gate requirements.
- ROADMAP.md reflects the current implementation status and resolved subcategory HTTP response behavior.
- Six root documents had literal closing content export tags removed.
- The feature-dev skill now proceeds under existing authorization and reserves questions for essential missing decisions.
- PR-review examples use the Codex skill invocation. The code-review skill handles prior reviews by revision and uses the selected GitHub tool's documented parameters.
- The installed React best-practices README now points to actual local resources and explains where upstream contributor tooling belongs. Its nested Markdown example uses an enclosing four-backtick fence.
- The view-transition README points to the relocated compiled guide. The skill and guide qualify version-dependent React and Next.js setup, and the obsolete configuration-documentation link was removed.
- The composition rule, summary, and compiled guide now recognize supported useContext usage alongside use. Existing forwardRef patterns are identified accurately.
- The migrator's example command uses this repository's actual installation path and Windows UTF-8 option.
- The Codex setup report distinguishes the initial hook-trust snapshot from current machine state. The migration report labels its original findings as historical.
- The demo image manifest now reports five recognizable-face images, matching its own eight-image table.

The React context correction was checked against official React documentation through Context7. Framework availability guidance was checked against the current Next.js guide, whose examples use React 19.3. The repository retains its declared React 19.2.8 and Next.js 16.3.1 dependencies. [React context reference](https://react.dev/reference/react/useContext), [Next.js view transitions guide](https://nextjs.org/docs/app/guides/view-transitions)

## Preserved Claude-file findings

The original Claude files retain their recorded contents under the earlier compatibility requirement. These issues remain in that preserved scope.

| Location | Finding |
| --- | --- |
| .claude/skills/vercel-react-best-practices/AGENTS.md, lines 116, 219, 892 | Three links omit the rules directory. Their actual targets are rules/async-defer-await.md, rules/async-cheap-condition-before-await.md, and rules/server-hoist-static-io.md. |
| .claude/skills/vercel-react-best-practices/README.md, line 58 | The Markdown template uses an outer triple-backtick fence around inner triple-backtick examples. |
| .claude/skills/vercel-react-best-practices/README.md, lines 18–35 | Contributor commands require upstream build resources absent from the installed skill copy. |
| .claude/agents/backend-engineer.md, line 27, and seo-performance-engineer.md, line 22 | Responsibilities still describe the retired whole-site access gate. D-063 records its removal. |
| .claude/agents/ui-ux-designer.md, line 27, and data-analytics-engineer.md, line 48 | Responsibilities retain hotspot behavior retired by D-091. Current implementation uses curated looks and look_select events. |
| .claude/agents/ui-reviewer.md, line 22 | The avoid-list reference should point to DESIGN_SYSTEM section 70. |
| .claude/skills/vercel-composition-patterns/rules/react19-no-forwardref.md, line 12 | The upstream text overstates useContext replacement. The Codex copy is corrected. |
| CLAUDE.md, Git workflow | Standalone Claude instructions lack the surfacebook safeguard in AGENTS.md. Claude sessions need the standing branch instruction supplied separately when they do not consume AGENTS.md. |

These findings matter when restoring or running the preserved Claude configuration. The project decisions and current roadmap provide the current product requirements.

## Further improvements requiring separate decisions

- The Request Access interface confirms ACCESS SENT while the integration subscribes the visitor to a list. CONTENT.md records the dependency on an owner-configured Klaviyo flow or manual delivery. Changing that interface requires an application task.
- The demo image manifest already records missing individual photo URLs and photographer provenance. The audit verified the eight asset filenames and corrected the table count. It did not reconstruct missing source records or establish additional image permissions.
- Historical plans and decisions contain superseded designs. Current documents now identify their precedence. Their original chronology is retained for traceability.

## Validation and limits

All original files decoded as UTF-8 and had balanced code-fence delimiters. All required agent and skill name/description fields were present, and all project agent skill dependencies resolved. Local Markdown links and fragment anchors were checked. The three preserved Claude links listed above are the remaining known missing local-file targets.

Copied technical examples were inspected for concrete contradictions. The audit did not execute every example or request every external URL. External documentation checks focused on the corrections that depended on current API behavior. The review used applicable prose guidance without adding website-specific publishing metadata to project instructions or historical plans.

Protected Claude hashes and the migration validator are checked before publication. The security review covers the final documentation changes. Publication follows the standing surfacebook-only rule in AGENTS.md.
