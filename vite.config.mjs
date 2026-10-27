import { defineConfig, loadEnv, transformWithOxc } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "REACT_APP_");
  // Preserve the existing public Firebase settings. Server credentials are never
  // included in this allowlist or exposed to the client build.
  const publicKeys = ["API_KEY", "AUTH_DOMAIN", "PROJECT_ID", "APP_ID"];
  const define = Object.fromEntries(publicKeys.map((key) => {
    const name = "REACT_APP_FIREBASE_" + key;
    return ["process.env." + name, JSON.stringify(env[name] || "")];
  }));
  return {
    define,
    plugins: [
      {
        name: "project-jsx",
        enforce: "pre",
        transform(code, id) {
          if (!/\/src\/.*\.js$/.test(id.replaceAll("\\", "/"))) return;
          return transformWithOxc(code, id, {
            lang: "jsx",
            jsx: { runtime: "automatic", development: command === "serve" },
          });
        },
      },
      react(),
    ],
    build: { outDir: "build", manifest: true },
    optimizeDeps: {
      entries: ["index.html"],
      rolldownOptions: { moduleTypes: { ".js": "jsx" } },
    },
    server: { host: "127.0.0.1", port: 3000 },
  };
});
