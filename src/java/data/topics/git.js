/* Git — concept cards and the boss fight. */

export const concepts = [
  {
    id: "three-areas",
    title: "Working tree, index & commits",
    emoji: "📸",
    hot: true,
    lab: "git",
    simple:
      "Git is a photo studio. The working tree is the messy set. The staging area is what you've arranged in front of the camera. A commit is the photo: permanent, labelled and filed in the album (the repository).",
    points: [
      "**Working tree** → `git add` → **index (staging area)** → `git commit` → **repository**.",
      "A commit is a **snapshot** plus parent pointer(s), author and message, named by its SHA hash.",
      "A **branch** is just a movable pointer to a commit. **HEAD** points at the branch you're on.",
      "`git diff` compares working tree with index; `git diff --staged` compares index with the last commit.",
    ],
    code: `git status                  # what changed, and what's staged
git add src/OrderService.java
git diff --staged           # exactly what the commit will contain
git commit -m "Reject orders with no items"
git log --oneline --graph   # the album`,
    lang: "shell",
    say: "Changes move from the working tree to the index with add, and into history with commit; a branch is a pointer to a commit, and HEAD points at the current branch.",
    trap: "“What is a branch, physically?” A tiny file holding a commit hash — which is why creating one is instant.",
  },
  {
    id: "merge-rebase",
    title: "Merge vs rebase",
    emoji: "🪢",
    hot: true,
    lab: "git",
    simple:
      "Merge ties two storylines together with a knot: the history shows exactly what happened, knots and all. Rebase rewrites your chapter as if you'd started it after the latest chapter: a straight, tidy story, but with new page numbers.",
    points: [
      "**Merge** joins branches with a merge commit (or a **fast-forward** when nothing diverged). Non-destructive: existing commits stay as they are.",
      "**Rebase** replays your commits on top of another branch, creating **new commits with new hashes** and a linear history.",
      "**Golden rule: never rebase commits other people have already pulled.**",
      "Interactive rebase (`git rebase -i`) squashes and rewords commits before a pull request.",
      "`git pull --rebase` puts your local commits on top of what was fetched, instead of adding a merge commit.",
    ],
    code: `# Merge: keep history as it happened
git switch main
git merge feature/checkout        # a merge commit if both sides moved on

# Rebase: replay my branch on top of the latest main
git switch feature/checkout
git fetch origin
git rebase origin/main            # my commits get new hashes: linear history
git push --force-with-lease       # only because this branch is mine alone`,
    lang: "shell",
    say: "Merge preserves history with a merge commit, while rebase rewrites my commits on top of the target for a linear history — so I rebase only my own unshared branches.",
    trap: "“Why `--force-with-lease` instead of `--force`?” It refuses to overwrite the remote branch if someone else pushed commits you haven't seen.",
  },
  {
    id: "reset-revert",
    title: "reset vs revert",
    emoji: "⏪",
    hot: true,
    lab: "git",
    simple:
      "Reset is tearing pages out of your own notebook — fine before you've shown anyone. Revert is writing a new page that says “ignore page 12” — the only polite option once other people have a copy.",
    points: [
      "`git reset --soft HEAD~1`: move the branch back one commit, **keep the changes staged**.",
      "`git reset --mixed HEAD~1` (the default): keep the changes, **unstaged**.",
      "`git reset --hard HEAD~1`: **throw the changes away**. Handle with care.",
      "`git revert <sha>`: add a **new commit that undoes** an old one. History stays intact — safe on shared branches.",
      "“Lost” a commit? **`git reflog`** remembers where HEAD has been.",
    ],
    code: `git reset --soft HEAD~1    # undo the commit, keep the changes staged
git reset --mixed HEAD~1   # undo the commit, keep the changes as unstaged edits
git reset --hard HEAD~1    # undo the commit AND discard the changes

git revert a1b2c3d         # shared branch? add a commit that undoes a1b2c3d

git reflog                 # every place HEAD has been, lost commits included
git reset --hard HEAD@{1}`,
    lang: "shell",
    say: "reset moves the branch pointer and rewrites local history — soft keeps changes staged, mixed unstaged, hard discards them — while revert adds an undo commit, which is what I use on shared branches.",
    trap: "“You pushed a bad commit to main. Reset or revert?” Revert. A reset rewrites history everyone else already has.",
  },
  {
    id: "stash",
    title: "git stash",
    emoji: "🗄️",
    lab: "git",
    simple:
      "Stash is a desk drawer. Sweep your half-finished work into it, fix the urgent bug on a clean desk, then pull the work back out.",
    points: [
      "`git stash` saves tracked changes, staged and unstaged, and cleans the working tree. Add `-u` for untracked files.",
      "`git stash pop` re-applies the latest stash **and removes it**; `git stash apply` keeps it in the list.",
      "Stashes form a stack: `git stash list`, `git stash drop`.",
      "Popping can conflict, just like a merge.",
    ],
    code: `git stash push -u -m "half-done discount rules"   # include untracked files
git switch -c hotfix/null-email main
# ...fix, commit, push...
git switch feature/discounts
git stash list
git stash pop                                     # re-apply and remove from the stash`,
    lang: "shell",
    say: "git stash shelves uncommitted work so I can switch context cleanly; pop re-applies and drops it, apply re-applies and keeps it.",
    trap: "“Does `git stash` save untracked files?” Not by default. Use `git stash -u`.",
  },
  {
    id: "conflicts",
    title: "Merge conflicts",
    emoji: "⚔️",
    simple:
      "A conflict is Git saying: “You and your teammate both rewrote the same sentence. I won't guess which version is right.”",
    points: [
      "Happens when **both sides changed the same lines** (or one side deleted a file the other edited).",
      "Git marks the file with `<<<<<<<`, `=======` and `>>>>>>>` sections.",
      "Edit to the right result, remove the markers, `git add` the file, then `git commit` (merge) or `git rebase --continue`.",
      "`git merge --abort` or `git rebase --abort` takes you back to before you started.",
      "Prevention: small pull requests and pulling in `main` often.",
    ],
    code: `git merge feature/bulk-orders
# CONFLICT (content): Merge conflict in OrderLimits.java
#   <<<<<<< HEAD
#   MAX_ITEMS = 50;
#   =======
#   MAX_ITEMS = 100;
#   >>>>>>> feature/bulk-orders
# edit the file: keep the right value, delete the markers
git add OrderLimits.java
git commit                    # or: git rebase --continue during a rebase
git merge --abort             # changed your mind? back to before the merge`,
    lang: "shell",
    say: "I resolve conflicts by understanding both changes, editing to the correct combined result, staging the file and continuing — and I keep branches short-lived so conflicts stay small.",
    trap: "“Can a merge with no textual conflict still break the build?” Yes. Two changes can each be fine and still be incompatible, which is why CI runs on the merged result.",
  },
  {
    id: "branching-workflow",
    title: "Workflow, .gitignore & cherry-pick",
    emoji: "🌳",
    simple:
      "Trunk-based development: everyone works on short-lived branches off main and merges daily, hiding unfinished features behind flags. GitFlow: long-lived develop and release branches — heavier, and suited to scheduled releases.",
    points: [
      "Feature branch → **pull request** → code review → **CI green** → merge.",
      "**Trunk-based** (short branches, feature flags) vs **GitFlow** (develop, release and hotfix branches).",
      "`.gitignore` build output, IDE files, logs and `.env`. **Never commit secrets.**",
      "`git cherry-pick <sha>` copies one commit elsewhere, like a hotfix onto a release branch.",
      "Tag releases: `git tag -a v1.4.0`.",
    ],
    code: `# .gitignore for a Spring Boot project
target/
build/
.idea/
*.iml
*.log
.env

git cherry-pick 9f8e7d6               # copy one hotfix onto the release branch
git tag -a v1.4.0 -m "Release 1.4.0"`,
    lang: "shell",
    say: "We work on short-lived branches merged through reviewed pull requests with green CI, cherry-pick hotfixes onto release branches and tag every release.",
    trap: "“You committed an API key, then deleted it in the next commit. Are you safe?” No, it's still in history. Rotate the key first, then clean the history if you need to.",
  },
];

export const boss = [
  {
    q: "Which command undoes the last commit but keeps its changes staged?",
    options: ["git reset --hard HEAD~1", "git reset --soft HEAD~1", "git revert HEAD", "git stash"],
    answer: 1,
    why: "--soft moves the branch pointer back and leaves the index exactly as the commit had it.",
  },
  {
    q: "A bad commit is already on the shared main branch. What's the safest undo?",
    options: ["git reset --hard, then force-push", "git revert <sha>", "Delete the branch", "git rebase -i to drop it"],
    answer: 1,
    why: "revert adds a new commit that undoes the change, without rewriting history your teammates already have.",
  },
  {
    q: "What does rebasing do to your branch's commits?",
    options: ["Nothing — it only moves the branch label", "Replays them as new commits with new hashes", "Squashes them into one merge commit", "Deletes them"],
    answer: 1,
    why: "Each commit is re-applied on top of the target, producing new commits, which is why you shouldn't rebase shared work.",
  },
  {
    q: "What does git stash pop do?",
    options: ["Applies the latest stash and removes it from the list", "Deletes every stash", "Applies the oldest stash and keeps it", "Commits the stash"],
    answer: 0,
    why: "pop = apply + drop, for the most recent stash. apply keeps it in the list.",
  },
  {
    q: "What's the golden rule of rebasing?",
    options: ["Always rebase main onto feature branches", "Never rebase commits others have already pulled", "Rebase only on release days", "Rebase instead of committing"],
    answer: 1,
    why: "Rebasing rewrites history. If others built on the old commits, their history and yours no longer match.",
  },
];
