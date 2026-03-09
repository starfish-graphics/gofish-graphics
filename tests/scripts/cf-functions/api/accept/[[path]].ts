/**
 * Cloudflare Pages Function: accept a single visual diff story.
 *
 * Route: POST /api/accept/*
 *
 * Reads after-files from the same origin, then commits them to the
 * PR branch via the GitHub API. GITHUB_TOKEN is a Cloudflare Pages secret.
 */

interface Env {
  GITHUB_TOKEN: string;
}

interface Meta {
  repo: string;
  branch: string;
  sha: string;
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
  content: string,
  encoding: "base64" | "utf-8" = "base64"
): Promise<string> {
  const res = await fetch(`${apiBase}/git/blobs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content, encoding }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub blob creation failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { sha: string };
  return data.sha;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { params, env, request } = ctx;

  const token = env.GITHUB_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify({ error: "GITHUB_TOKEN not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Reconstruct story path from catch-all params
  const pathParts = Array.isArray(params.path) ? params.path : [params.path];
  const storyPath = pathParts.join("/");
  const pngPath = storyPath.replace(/\.html$/, ".png");

  const origin = new URL(request.url).origin;

  // Load repo metadata
  const metaRes = await fetch(`${origin}/data/meta.json`);
  if (!metaRes.ok) {
    return new Response(JSON.stringify({ error: "meta.json not found" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const meta = (await metaRes.json()) as Meta;
  const [owner, repo] = meta.repo.split("/");
  const branch = meta.branch;

  // Fetch after-files
  const [domRes, screenshotRes] = await Promise.all([
    fetch(`${origin}/_after-files/dom/${storyPath}`),
    fetch(`${origin}/_after-files/screenshots/${pngPath}`),
  ]);

  if (!domRes.ok) {
    return new Response(
      JSON.stringify({ error: `After DOM file not found: ${storyPath}` }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const githubHeaders = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    "User-Agent": "gofish-visual-review/1.0",
  };
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

  // Create blobs
  const domBuf = await domRes.arrayBuffer();
  const domBase64 = arrayBufferToBase64(domBuf);
  const domBlobSha = await createBlob(apiBase, githubHeaders, domBase64);

  let screenshotBlobSha: string | null = null;
  if (screenshotRes.ok) {
    const screenshotBuf = await screenshotRes.arrayBuffer();
    const screenshotBase64 = arrayBufferToBase64(screenshotBuf);
    screenshotBlobSha = await createBlob(
      apiBase,
      githubHeaders,
      screenshotBase64
    );
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

  // Get base tree SHA from HEAD commit
  const commitRes = await fetch(`${apiBase}/git/commits/${headSha}`, {
    headers: githubHeaders,
  });
  const commit = (await commitRes.json()) as { tree: { sha: string } };
  const treeSha = commit.tree.sha;

  // Build tree items
  const treeItems: Array<{
    path: string;
    mode: string;
    type: string;
    sha: string;
  }> = [
    {
      path: `__snapshots__/dom/${storyPath}`,
      mode: "100644",
      type: "blob",
      sha: domBlobSha,
    },
  ];
  if (screenshotBlobSha) {
    treeItems.push({
      path: `__snapshots__/screenshots/${pngPath}`,
      mode: "100644",
      type: "blob",
      sha: screenshotBlobSha,
    });
  }

  // Create tree
  const newTreeRes = await fetch(`${apiBase}/git/trees`, {
    method: "POST",
    headers: githubHeaders,
    body: JSON.stringify({ base_tree: treeSha, tree: treeItems }),
  });
  const newTree = (await newTreeRes.json()) as { sha: string };

  // Create commit
  const newCommitRes = await fetch(`${apiBase}/git/commits`, {
    method: "POST",
    headers: githubHeaders,
    body: JSON.stringify({
      message: `Accept visual diff: ${storyPath}`,
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

  return new Response(JSON.stringify({ ok: true, commitSha: newCommit.sha }), {
    headers: { "Content-Type": "application/json" },
  });
};
