#!/usr/bin/env bun

import { join, dirname } from "path";
import { existsSync } from "fs";

// Import template engine from create-crud-app-template (reuse)
const templateEnginePath = join(
  dirname(import.meta.dir),
  "../create-crud-app-template/scripts/template-engine.ts",
);
let generateFromTemplate: (
  templatePath: string,
  outputPath: string,
  context: Record<string, any>,
) => void;

try {
  const engineModule = await import(templateEnginePath);
  generateFromTemplate = engineModule.generateFromTemplate;
} catch {
  console.error(
    "Template engine not found. Please ensure create-crud-app-template skill exists.",
  );
  process.exit(1);
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TemplateType = "chat" | "simple" | "router" | "tool";

interface GenerationOptions {
  type: TemplateType;
  name: string;
  outputDir: string;
  provider?: "openai" | "anthropic" | "google";
  model?: string;
}

// ============================================================================
// PATH HELPERS
// ============================================================================

const getRouterPath = (outputDir: string, name: string): string =>
  join(outputDir, "packages", "api", "src", "routers", `${name}.ts`);

const getRoutePath = (outputDir: string, name: string): string =>
  join(outputDir, "apps", "web", "src", "routes", `_auth.${name}.tsx`);

const getToolPath = (outputDir: string, name: string): string =>
  join(outputDir, "packages", "api", "src", "tools", `${name}.ts`);

// ============================================================================
// DEFAULT MODELS BY PROVIDER
// ============================================================================

const DEFAULT_MODELS = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
  google: "gemini-1.5-flash",
} as const;

// ============================================================================
// TEMPLATE GENERATION
// ============================================================================

export function generate(options: GenerationOptions): void {
  const { type, name, outputDir, provider = "openai", model } = options;
  const scriptDir = dirname(import.meta.dir);
  const templatePath = join(scriptDir, "scaffold-templates", `${type}.hbs`);

  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const outputPath =
    type === "router"
      ? getRouterPath(outputDir, name)
      : type === "tool"
        ? getToolPath(outputDir, name)
        : getRoutePath(outputDir, name);

  const templateContext = {
    name,
    provider,
    model: model || DEFAULT_MODELS[provider],
    PascalCase: pascalCase,
    camelCase: camelCase,
  };

  generateFromTemplate(templatePath, outputPath, templateContext);
  console.log(`✅ Generated ${type} '${name}' at ${outputPath}`);
  printNextSteps(type, name, provider);
}

function printNextSteps(
  type: TemplateType,
  name: string,
  provider: string,
): void {
  const cc = camelCase(name);
  const providerKey = `${provider.toUpperCase()}_API_KEY`;

  console.log(`\n📋 Next steps:`);

  if (type === "tool") {
    console.log(`   Import and use the tool in your AI router`);
    return;
  }

  console.log(`   1. Add ${providerKey} to packages/auth/env.ts:`);
  console.log(`      ${providerKey}: z.string().optional(),`);

  if (type === "chat" || type === "router") {
    console.log(`   2. Register router in packages/api/src/routers/index.ts:`);
    console.log(`      import { ${cc}Router } from "./${name}";`);
    console.log(
      `      export const appRouter = { ${name}: ${cc}Router, ... };`,
    );
  }

  console.log(
    `   3. Add to sidebar in apps/web/src/components/app-sidebar.tsx`,
  );

  console.log(`   4. Install dependencies:`);
  console.log(`      bun add ai @ai-sdk/${provider} @orpc/ai-sdk @orpc/client`);

  console.log(
    `   5. Set ${providerKey} environment variable (injected during build/deploy)`,
  );

  console.log(
    `   6. Type check: bunx oxlint --type-check --type-aware <generated-files>\n`,
  );
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

function pascalCase(str: string): string {
  if (!str) return "";
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function camelCase(str: string): string {
  if (!str) return "";
  const parts = str.split(/[-_]/);
  return parts
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join("");
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: bun run generate.ts <type> <name> [options]");
    console.log("\nTypes:");
    console.log(
      "  chat   - Full-stack AI chat (router + frontend route with streaming)",
    );
    console.log(
      "  simple - Simple AI prompt-response (no streaming, no history)",
    );
    console.log("  router - Backend AI router only");
    console.log("  tool   - Tool definition for AI function calling");
    console.log("\nOptions:");
    console.log(
      "  --provider <name>  - AI provider (openai, anthropic, google) - default: openai",
    );
    console.log("  --model <name>     - Model name (overrides default)");
    console.log("\nExamples:");
    console.log("  bun run generate.ts chat assistant");
    console.log("  bun run generate.ts chat assistant --provider anthropic");
    console.log("  bun run generate.ts simple summarize --provider google");
    console.log(
      "  bun run generate.ts router ai-backend --provider openai --model gpt-4o",
    );
    console.log("  bun run generate.ts tool get-weather");
    process.exit(1);
  }

  const [type, ...restArgs] = args;
  const validTypes: TemplateType[] = ["chat", "simple", "router", "tool"];

  if (!validTypes.includes(type as TemplateType)) {
    console.error(
      `❌ Invalid type: ${type}. Must be one of: ${validTypes.join(", ")}`,
    );
    process.exit(1);
  }

  // Parse options
  let name = "";
  let provider: "openai" | "anthropic" | "google" = "openai";
  let model: string | undefined;

  for (let i = 0; i < restArgs.length; i++) {
    const arg = restArgs[i];
    if (arg === "--provider") {
      provider = restArgs[++i] as "openai" | "anthropic" | "google";
      if (!["openai", "anthropic", "google"].includes(provider)) {
        console.error(`❌ Invalid provider: ${provider}`);
        process.exit(1);
      }
    } else if (arg === "--model") {
      model = restArgs[++i];
    } else if (!arg.startsWith("--")) {
      name = arg;
    }
  }

  if (!name) {
    console.error(`❌ ${type} requires a name`);
    process.exit(1);
  }

  generate({
    type: type as TemplateType,
    name,
    outputDir: process.cwd(),
    provider,
    model,
  });
}
