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
  .option(
    "--http-client <type>",
    "HTTP client to use (fetch/axios)",
    "fetch"
  )
  .option(
    "--with-cache",
    "Generate client with HTTP response caching enabled",
    false
  )
  .option(
    "--with-retry",
    "Generate client with automatic request retry for failures",
    false
  )
  .option(
    "--with-throttling",
    "Generate client with request throttling/rate limiting",
    false
  )
  .option(
    "--with-batching",
    "Generate client with request batching for similar requests",
    false
  )
  .option(
    "--with-enhanced-logger",
    "Generate client with enhanced logger for better error handling",
    false
  )
  .option(
    "--with-cancellation",
    "Generate client with request cancellation support",
    false
  )
  .option(
    "--with-debounce",
    "Generate client with request debouncing support",
    false
  )
  .option(
    "--log-level <level>",
    "Log level (silent/error/warn/info/debug)",
    "info"
  )
  .action(async (options) => {
    try {
      // Use dynamic import to load the ES module
      const { generateClient } = await import("../dist/index.mjs");
      
      // Set up the log level from options
      const logLevel = options.logLevel || 'info';
      
      // Advanced HTTP client options
      const httpClientOptions = {};
      
      // Add cache configuration if enabled
      if (options.withCache) {
        httpClientOptions.cache = {
          enabled: true,
          ttl: 60000, // 1 minute default
          maxEntries: 100,
        };
        console.info("HTTP response caching enabled");
      }
      
      // Add retry configuration if enabled
      if (options.withRetry) {
        httpClientOptions.retry = {
          enabled: true,
          maxRetries: 3,
          statusCodes: [408, 429, 500, 502, 503, 504],
        };
        console.info("Automatic request retry enabled");
      }
      
      // Add throttling configuration if enabled
      if (options.withThrottling) {
        httpClientOptions.throttle = {
          enabled: true,
          limit: 60,
          interval: 60000, // 1 minute
          strategy: 'queue',
        };
        console.info("Request throttling enabled");
      }

      // Generate the client
      console.info("Generating client...");
      
      // Enable enhanced logger if requested
      if (options.withEnhancedLogger) {
        console.info("Enhanced logger enabled");
      }
      
      // Enable request cancellation if requested
      if (options.withCancellation) {
        console.info("Request cancellation support enabled");
        
        // Add cancellation configuration
        httpClientOptions.cancellation = {
          enabled: true
        };
      }
      
      // Enable request debouncing if requested
      if (options.withDebounce) {
        console.info("Request debouncing support enabled");
        
        // Add debounce configuration
        httpClientOptions.debounce = {
          enabled: true,
          delay: 300,
          cancelPending: true
        };
      }
      
      await generateClient({
        specPath: path.resolve(process.cwd(), options.input),
        outputDir: path.resolve(process.cwd(), options.output),
        format: options.format,
        options: {
          namingConvention: options.naming,
          httpClient: options.httpClient,
          httpClientOptions: Object.keys(httpClientOptions).length > 0 
            ? httpClientOptions 
            : undefined,
          enableBatching: options.withBatching,
          enableEnhancedLogger: options.withEnhancedLogger,
          enableCancellation: options.withCancellation,
          enableDebounce: options.withDebounce,
          logLevel, // Pass the log level to the generator
        },
      });

      console.info("Client generated successfully!");
    } catch (error) {
      console.error("Error generating client:", error.message);
      process.exit(1);
    }
  });

// Add init command to create a configuration file
program
  .command("init")
  .description("Create a configuration file for the client generator")
  .option(
    "-f, --file <path>",
    "Path to configuration file",
    "./openapitools.json"
  )
  .action(async (options) => {
    const fs = require("fs");
    const configPath = path.resolve(process.cwd(), options.file);
    
    try {
      // Check if file already exists
      if (fs.existsSync(configPath)) {
        console.log(`Configuration file already exists at ${configPath}`);
        console.log("Use --file to specify a different path or delete the existing file.");
        return;
      }
      
      // Create a default configuration
      const defaultConfig = {
        "$schema": "https://raw.githubusercontent.com/arthurmtro/openapi-tools/master/packages/client/schema.json",
        "generation": {
          "inputSpec": "./openapi.yaml",
          "outputDir": "./src/api",
          "options": {
            "namingConvention": "camelCase",
            "httpClient": "fetch",
            "httpClientOptions": {
              "cache": {
                "enabled": false
              },
              "retry": {
                "enabled": false
              },
              "throttle": {
                "enabled": false
              },
              "cancellation": {
                "enabled": false
              },
              "debounce": {
                "enabled": false
              }
            },
            "enableBatching": false,
            "enableCancellation": false,
            "enableDebounce": false
          }
        }
      };
      
      // Write the file
      fs.writeFileSync(
        configPath, 
        JSON.stringify(defaultConfig, null, 2), 
        { encoding: "utf8" }
      );
      
      console.log(`Configuration file created at ${configPath}`);
      console.log("Edit this file to customize your client generation settings.");
    } catch (error) {
      console.error("Error creating configuration file:", error.message);
      process.exit(1);
    }
  });

program.parse();
