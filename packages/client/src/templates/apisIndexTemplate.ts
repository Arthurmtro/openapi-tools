/**
 * Template for generating the apis/index.ts file
 */
export function generateApisIndexTemplate(
  apiGroups: Array<{ originalName: string; formattedName: string }>,
): string {
  return apiGroups
    .map((group) => {
      const className = `${group.originalName.charAt(0).toUpperCase()}${group.originalName.slice(1)}Api`;
      return `export { ${className} } from './${group.originalName}-api';`;
    })
    .join('\n');
}
