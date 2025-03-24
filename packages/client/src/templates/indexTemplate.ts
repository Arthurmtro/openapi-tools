/**
 * Template for generating the index.ts file
 */
export function generateIndexTemplate(): string {
  return `export * from './client';
export * from './generated/apis';
export * from './generated/models';
`;
}
