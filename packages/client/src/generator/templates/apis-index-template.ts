/**
 * Template for generating the apis/index.ts file
 */
export function generateApisIndexTemplate(
  apiGroups: Array<{ originalName: string; formattedName: string }>,
): string {
  return apiGroups
    .map((group) => {
      const className = `${group.originalName.charAt(0).toUpperCase()}${group.originalName.slice(1)}Api`;
      // Use formattedName for the file path to ensure no hyphens in import paths
      return `export { ${className} } from './${group.formattedName}-api';`;
    })
    .join('\n');
}
