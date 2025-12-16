const { readFilesToContextTool } = default_api;
const files = await readFilesToContextTool({
  file_paths: [
    "src/convex/demoVideos.ts",
    "src/convex/schema/index.ts"
  ],
  replace_files_in_context: true
});