import path from 'path';
import { fileURLToPath } from 'url';
import { generateClient } from '@arthurmtro/openapi-tools-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('Generating API client from OpenAPI spec...');
  
  try {
    await generateClient({
      specPath: path.resolve(__dirname, '../openapi/petstore.yaml'),
      outputDir: path.resolve(__dirname, '../src/api/generated'),
      options: {
        namingConvention: 'camelCase',
        httpClient: 'fetch'
      }
    });
    
    console.log('API client generated successfully!');
  } catch (error) {
    console.error('Failed to generate API client:', error);
    process.exit(1);
  }
}

main();