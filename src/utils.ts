export const phpConfigTemplate = (config: Record<string, any>) => `<?php
// This is an auto-generated file. Please avoid making changes here.
// Configure your settings in the "vite.config.js" file instead.
return [
${Object.entries(config)
  .filter(([, value]) => value !== undefined)
  .map(([key, value]) => {
    if (typeof value === 'string') value = `'${value}'`
    return `  '${key}' => ${value}`
  })
  .join(',\n')}
];`
