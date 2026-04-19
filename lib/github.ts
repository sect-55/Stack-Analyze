const TOKEN = process.env.GITHUB_TOKEN;
const FETCH_TIMEOUT_MS = 8000;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "dev-tracker-app/1.0",
  };
  if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;
  return headers;
}

export interface Repo {
  name: string;
  deps: string[];
  language: string | null;
}

interface GitHubRepo {
  name: string;
  language: string | null;
  fork: boolean;
  archived: boolean;
}

interface GitHubContent {
  content?: string;
}

async function fetchWithTimeout(url: string, options: RequestInit, ms = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getFileContent(username: string, repoName: string, filePath: string, headers: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
      { headers, next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data: GitHubContent = await res.json();
    if (!data.content) return null;
    return Buffer.from(data.content, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function parsePackageJson(content: string): string[] {
  try {
    const pkg = JSON.parse(content);
    return Object.keys({
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
      ...(pkg.peerDependencies ?? {}),
    });
  } catch {
    return [];
  }
}

function parseRequirementsTxt(content: string): string[] {
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("-"))
    .map((l) => l.split(/[=<>!;\s]/)[0].toLowerCase())
    .filter(Boolean);
}

function parseGemfile(content: string): string[] {
  const deps: string[] = [];
  const re = /^\s*gem\s+['"]([^'"]+)['"]/gm;
  let match;
  while ((match = re.exec(content)) !== null) {
    deps.push(match[1].toLowerCase());
  }
  return deps;
}

function parsePomXml(content: string): string[] {
  const deps: string[] = [];
  const re = /<artifactId>([^<]+)<\/artifactId>/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    deps.push(match[1].toLowerCase());
  }
  return deps;
}

function parseBuildGradle(content: string): string[] {
  const deps: string[] = [];
  const re = /(?:implementation|api|compile|testImplementation)\s*[\('"]\s*['"]?([^'":\)]+):/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const parts = match[1].split(":");
    const name = parts[parts.length - 1].toLowerCase();
    if (name) deps.push(name);
  }
  return deps;
}

function parseGoMod(content: string): string[] {
  const deps: string[] = [];
  const re = /^\s+([^\s]+)\s+v[\d.]/gm;
  let match;
  while ((match = re.exec(content)) !== null) {
    const parts = match[1].split("/");
    deps.push(parts[parts.length - 1].toLowerCase());
    deps.push(match[1].toLowerCase());
  }
  return deps;
}

function parseCargoToml(content: string): string[] {
  const deps: string[] = [];
  const re = /^\s*([a-zA-Z0-9_-]+)\s*=/gm;
  let match;
  while ((match = re.exec(content)) !== null) {
    deps.push(match[1].toLowerCase());
  }
  return deps;
}

const MANIFESTS: Array<{
  file: string;
  language: string;
  parse: (c: string) => string[];
}> = [
  { file: "package.json",     language: "JavaScript/TypeScript", parse: parsePackageJson },
  { file: "requirements.txt", language: "Python",                parse: parseRequirementsTxt },
  { file: "Gemfile",          language: "Ruby",                  parse: parseGemfile },
  { file: "pom.xml",          language: "Java (Maven)",          parse: parsePomXml },
  { file: "build.gradle",     language: "Java/Kotlin (Gradle)",  parse: parseBuildGradle },
  { file: "go.mod",           language: "Go",                    parse: parseGoMod },
  { file: "Cargo.toml",       language: "Rust",                  parse: parseCargoToml },
];

export async function getUserReposWithPackages(username: string): Promise<Repo[]> {
  const headers = getHeaders();

  const res = await fetchWithTimeout(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
    { headers, next: { revalidate: 300 } }
  );

  if (res.status === 404) throw new Error("USER_NOT_FOUND");
  if (res.status === 403) throw new Error("RATE_LIMITED");
  if (!res.ok) throw new Error("GITHUB_ERROR");

  const repos: GitHubRepo[] = await res.json();

  const activeRepos = repos
    .filter((r) => !r.fork && !r.archived)
    .slice(0, 50);

  const results = await Promise.allSettled(
    activeRepos.map(async (repo): Promise<Repo> => {
      const allDeps: string[] = [];

      const manifestResults = await Promise.allSettled(
        MANIFESTS.map(async ({ file, parse }) => {
          const content = await getFileContent(username, repo.name, file, headers);
          if (!content) return [];
          return parse(content);
        })
      );

      for (const r of manifestResults) {
        if (r.status === "fulfilled") allDeps.push(...r.value);
      }

      return {
        name: repo.name,
        language: repo.language,
        deps: Array.from(new Set(allDeps)),
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Repo> => r.status === "fulfilled")
    .map((r) => r.value);
}
