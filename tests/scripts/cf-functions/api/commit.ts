/**
 * Cloudflare Pages Function: batch-commit accepted visual diff stories.
 *
 * Route: POST /api/commit
 *
 * The client fetches file contents in the browser (no subrequest limit) and
 * sends them in the request body. The Worker only makes GitHub API calls:
 * - 1 blob creation per screenshot (binary, needs blob API)
 * - DOM files use tree `content` field directly (no blob API needed)
 * - 5 fixed GitHub calls (get ref, get commit, create tree, create commit, update ref)
 *
 * Total subrequests: N (screenshots) + 5 — well within Cloudflare's 50 limit.
 *
 * Request body:
 *   { paths, domContents, screenshotContents, repo, branch }
 *
 * GITHUB_TOKEN is a Cloudflare Pages secret.
 */

interface Env {
  GITHUB_TOKEN: string;
}

interface CommitBody {
  paths: string[];
  domContents: Record<string, string>; // storyPath → HTML text
  screenshotContents: Record<string, string>; // pngPath → base64
  repo: string;
  branch: string;
}

type TreeItem = {
  path: string;
  mode: string;
  type: string;
  sha?: string;
  content?: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function createBlob(
  apiBase: string,
  headers: Record<string, string>,
  content: string
): Promise<string> {
  const res = await fetch(`${apiBase}/git/blobs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content, encoding: "base64" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub blob creation failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { sha: string };
  return data.sha;
}

async function githubJson<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${label} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    return await handleCommit(ctx);
  } catch (e) {
    return json({ ok: false, error: `Unexpected error: ${String(e)}` }, 500);
  }
};

async function handleCommit(
  ctx: EventContext<Env, string, unknown>
): Promise<Response> {
  const { env, request } = ctx;

  const token = env.GITHUB_TOKEN;
  if (!token) {
    return json({ error: "GITHUB_TOKEN not configured" }, 500);
  }

  let body: CommitBody;
  try {
    const raw = (await request.json()) as Partial<CommitBody>;
    if (
      !Array.isArray(raw.paths) ||
      raw.paths.length === 0 ||
      !raw.repo ||
      !raw.branch
    ) {
      return json({ error: "Invalid request body" }, 400);
    }
    body = raw as CommitBody;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const {
    paths,
    domContents = {},
    screenshotContents = {},
    repo,
    branch,
  } = body;
  const [owner, repoName] = repo.split("/");

  const githubHeaders = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    "User-Agent": "gofish-visual-review/1.0",
  };
  const apiBase = `https://api.github.com/repos/${owner}/${repoName}`;

  const treeItems: TreeItem[] = [];
  const errors: string[] = [];
  let accepted = 0;

  for (const storyPath of paths) {
    const pngPath = storyPath.replace(/\.html$/, ".png");
    try {
      const domContent = domContents[storyPath];
      if (domContent == null) {
        errors.push(`${storyPath}: DOM content not provided`);
        continue;
      }

      // Use tree `content` for DOM files — GitHub creates the blob internally,
      // saving a subrequest compared to creating the blob explicitly.
      treeItems.push({
        path: `__snapshots__/dom/${storyPath}`,
        mode: "100644",
        type: "blob",
        content: domContent,
      });

      // Screenshots are binary, so they still need the blob API.
      const screenshotBase64 = screenshotContents[pngPath];
      if (screenshotBase64) {
        const screenshotBlobSha = await createBlob(
          apiBase,
          githubHeaders,
          screenshotBase64
        );
        treeItems.push({
          path: `__snapshots__/screenshots/${pngPath}`,
          mode: "100644",
          type: "blob",
          sha: screenshotBlobSha,
        });
      }

      accepted++;
    } catch (e) {
      errors.push(`${storyPath}: ${String(e)}`);
    }
  }

  if (treeItems.length === 0) {
    return json({ ok: false, accepted: 0, errors });
  }

  // Get current HEAD SHA
  const refData = await githubJson<{ object: { sha: string } }>(
    await fetch(`${apiBase}/git/ref/heads/${branch}`, {
      headers: githubHeaders,
    }),
    `get ref heads/${branch}`
  );
  const headSha = refData.object.sha;

  // Get base tree SHA
  const commitData = await githubJson<{ tree: { sha: string } }>(
    await fetch(`${apiBase}/git/commits/${headSha}`, {
      headers: githubHeaders,
    }),
    `get commit ${headSha}`
  );

  // Create tree with all changes
  const newTree = await githubJson<{ sha: string }>(
    await fetch(`${apiBase}/git/trees`, {
      method: "POST",
      headers: githubHeaders,
      body: JSON.stringify({
        base_tree: commitData.tree.sha,
        tree: treeItems,
      }),
    }),
    "create tree"
  );

  // Create single commit
  const newCommit = await githubJson<{ sha: string }>(
    await fetch(`${apiBase}/git/commits`, {
      method: "POST",
      headers: githubHeaders,
      body: JSON.stringify({
        message: `Accept ${accepted} visual diff(s)`,
        tree: newTree.sha,
        parents: [headSha],
      }),
    }),
    "create commit"
  );

  // Update branch ref
  const updateRes = await fetch(`${apiBase}/git/refs/heads/${branch}`, {
    method: "PATCH",
    headers: githubHeaders,
    body: JSON.stringify({ sha: newCommit.sha }),
  });
  if (!updateRes.ok) {
    const text = await updateRes.text();
    throw new Error(`Failed to update branch ref: ${text}`);
  }

  return json({
    ok: errors.length === 0,
    accepted,
    errors,
    commitSha: newCommit.sha,
  });
}
