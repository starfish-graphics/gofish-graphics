/**
 * Cloudflare Pages Function: accept all pending visual diff stories.
 *
 * Route: POST /api/accept-all
 *
 * Reads after-files from the same origin, then creates a single commit
 * with all accepted stories via the GitHub API. GITHUB_TOKEN is a
 * Cloudflare Pages secret.
 */

interface Env {
  GITHUB_TOKEN: string;
}

interface Meta {
  repo: string;
  branch: string;
  sha: string;
}

interface DiffSummary {
  path: string;
  kind: string;
  status: "pending" | "accepted" | "rejected";
  diffPercent: number | null;
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

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { env, request } = ctx;

  const token = env.GITHUB_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify({ error: "GITHUB_TOKEN not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const origin = new URL(request.url).origin;

  // Load repo metadata and diffs list in parallel
  const [metaRes, diffsRes] = await Promise.all([
    fetch(`${origin}/data/meta.json`),
    fetch(`${origin}/data/diffs.json`),
  ]);

  if (!metaRes.ok || !diffsRes.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to load meta.json or diffs.json" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const meta = (await metaRes.json()) as Meta;
  const allDiffs = (await diffsRes.json()) as DiffSummary[];
  const pendingDiffs = allDiffs.filter((d) => d.status === "pending");

  if (pendingDiffs.length === 0) {
    return new Response(JSON.stringify({ ok: true, accepted: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

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

  for (const diff of pendingDiffs) {
    const storyPath = diff.path;
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

      const domBuf = await domRes.arrayBuffer();
      const domBase64 = arrayBufferToBase64(domBuf);
      const domBlobSha = await createBlob(apiBase, githubHeaders, domBase64);

      treeItems.push({
        path: `__snapshots__/dom/${storyPath}`,
        mode: "100644",
        type: "blob",
        sha: domBlobSha,
      });

      if (screenshotRes.ok) {
        const screenshotBuf = await screenshotRes.arrayBuffer();
        const screenshotBase64 = arrayBufferToBase64(screenshotBuf);
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
    return new Response(JSON.stringify({ ok: false, accepted: 0, errors }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get current HEAD SHA
  const refRes = await fetch(`${apiBase}/git/ref/heads/${branch}`, {
    headers: githubHeaders,
  });
  if (!refRes.ok) {
    const text = await refRes.text();
    return new Response(
      JSON.stringify({ error: `Failed to get branch ref: ${text}` }),
      {
        status: refRes.status === 401 ? 401 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  const ref = (await refRes.json()) as { object: { sha: string } };
  const headSha = ref.object.sha;

  // Get base tree SHA
  const commitRes = await fetch(`${apiBase}/git/commits/${headSha}`, {
    headers: githubHeaders,
  });
  const commit = (await commitRes.json()) as { tree: { sha: string } };
  const treeSha = commit.tree.sha;

  // Create tree with all changes
  const newTreeRes = await fetch(`${apiBase}/git/trees`, {
    method: "POST",
    headers: githubHeaders,
    body: JSON.stringify({ base_tree: treeSha, tree: treeItems }),
  });
  const newTree = (await newTreeRes.json()) as { sha: string };

  // Create single commit
  const newCommitRes = await fetch(`${apiBase}/git/commits`, {
    method: "POST",
    headers: githubHeaders,
    body: JSON.stringify({
      message: `Accept ${accepted} visual diff(s)`,
      tree: newTree.sha,
      parents: [headSha],
    }),
  });
  const newCommit = (await newCommitRes.json()) as { sha: string };

  // Update branch ref
  const updateRes = await fetch(`${apiBase}/git/refs/heads/${branch}`, {
    method: "PATCH",
    headers: githubHeaders,
    body: JSON.stringify({ sha: newCommit.sha }),
  });
  if (!updateRes.ok) {
    const text = await updateRes.text();
    return new Response(
      JSON.stringify({ error: `Failed to update branch ref: ${text}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: errors.length === 0,
      accepted,
      errors,
      commitSha: newCommit.sha,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};
