import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  buildDirectory: "build",
  appDirectory: "src",
  future: {
    v8_viteEnvironmentApi: true,
    v8_middleware: true,
  },
} satisfies Config;
