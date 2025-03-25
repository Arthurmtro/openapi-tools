#!/usr/bin/env node

const { program } = require("commander");
const path = require("node:path");
const pkg = require("../package.json");

program
  .name("openapi-client")
  .description("Generate typed API clients from OpenAPI specifications")
  .version(pkg.version);

program
  .command("generate")
  .description("Generate a typed client from an OpenAPI specification")
  .requiredOption("-i, --input <path>", "Path to OpenAPI specification file")
  .requiredOption("-o, --output <directory>", "Output directory")
  .option(
    "-f, --format <format>",
    "Format of the OpenAPI specification (json/yaml)"
  )
  .option(
    "--naming <convention>",
    "Naming convention (camelCase/kebab-case/PascalCase)",
    "camelCase"
  )
  .action(async (options) => {
    try {
      // Use dynamic import to load the ES module
      const { generateClient } = await import("../dist/index.mjs");

      await generateClient({
        specPath: path.resolve(process.cwd(), options.input),
        outputDir: path.resolve(process.cwd(), options.output),
        format: options.format,
        options: {
          namingConvention: options.naming,
        },
      });

      console.log("Client generated successfully!");
    } catch (error) {
      console.error("Error generating client:", error.message);
      process.exit(1);
    }
  });

program.parse();
