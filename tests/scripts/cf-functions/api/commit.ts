/**
 * Cloudflare Pages Function: batch-commit accepted visual diff stories.
 *
 * Route: POST /api/commit
 *
 * Request body: { paths: string[] }
 *
 * For each path, fetches after-files from the same origin, then creates a
 * single commit with all accepted stories via the GitHub API.
 * GITHUB_TOKEN is a Cloudflare Pages secret.
 */

interface Env {
  GITHUB_TOKEN: string;
}

interface Meta {
  repo: string;
  branch: string;
  sha: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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

  let paths: string[];
  try {
    const body = (await request.json()) as { paths?: unknown };
    if (!Array.isArray(body.paths) || body.paths.length === 0) {
      return json(
        { error: "Request body must include non-empty paths array" },
        400
      );
    }
    paths = body.paths as string[];
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const origin = new URL(request.url).origin;

  const metaRes = await fetch(`${origin}/data/meta.json`);
  if (!metaRes.ok) {
    return json({ error: "Failed to load meta.json" }, 500);
  }
  const meta = (await metaRes.json()) as Meta;
  const [owner, repo] = meta.repo.split("/");
  const branch = meta.branch;

  const githubHeaders = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    "User-Agent": "gofish-visual-review/1.0",
  };
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

  // Fetch all after-files and create blobs
  const treeItems: Array<{
    path: string;
    mode: string;
    type: string;
    sha: string;
  }> = [];
  const errors: string[] = [];
  let accepted = 0;

  for (const storyPath of paths) {
    const pngPath = storyPath.replace(/\.html$/, ".png");
    try {
      const [domRes, screenshotRes] = await Promise.all([
        fetch(`${origin}/_after-files/dom/${storyPath}`),
        fetch(`${origin}/_after-files/screenshots/${pngPath}`),
      ]);

      if (!domRes.ok) {
        errors.push(`${storyPath}: after DOM file not found`);
        continue;
      }

      const domBlobSha = await createBlob(
        apiBase,
        githubHeaders,
        arrayBufferToBase64(await domRes.arrayBuffer())
      );
      treeItems.push({
        path: `__snapshots__/dom/${storyPath}`,
        mode: "100644",
        type: "blob",
        sha: domBlobSha,
      });

      if (screenshotRes.ok) {
        const screenshotBlobSha = await createBlob(
          apiBase,
          githubHeaders,
          arrayBufferToBase64(await screenshotRes.arrayBuffer())
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
