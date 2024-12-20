# AEM Clientlib Details Plugin

This plugin analyzes client libraries in an AEM project and exports the details into a report.

## Installation

```bash
npm install aem-clientlib-report-plugin --save-dev
```

## How to Use

```javascript

// Import plugin in webpack configuration file
const AEMClientlibDetailsPlugin = require('aem-clientlib-report-plugin');

// Provide plugin configuration
new AEMClientlibDetailsPlugin({
  uiAppsPath: path.resolve(__dirname, '../ui.apps/'),
  additionalData: ['categories', 'dependencies', 'embed'],
  exportToExcel: true,
  outputFilePath: 'clientlib-report.xlsx',
  excludeDirectories: ['target'],
  sortBy: 'size',         // or 'clientname'
  sortOrder: 'descending', // or 'ascending'
  hidePath: false,          // Hide the clientlib Path column
  logger: true,             // Enable logging to see generated files
});

// Note: uiAppsPath is path for ui.apps directory path

```

---

## Options

| Option              | Type       | Default Value          | Description                                           |
|---------------------|------------|------------------------|-------------------------------------------------------|
| `uiAppsPath`        | `string`   | -                      | Path to the `ui.apps` folder in your AEM project.     |
| `additionalData`    | `array`    | `[]`                   | Additional data fields to include in the report.      |
| `exportToExcel`     | `boolean`  | `false`                | Whether to export the report to an Excel file.        |
| `outputFilePath`    | `string`   | `clientlib-report.xlsx`| Path for the output report file.                      |
| `hidePath`          | `boolean`  | `false`                | Whether to hide the clientlib path in the report.      |
| `excludeDirectories`| `array`    | `[]`                   | Directories to exclude from the analysis.             |
| `sortBy`            | `string`   | `size`                 | Field to sort the report by (e.g., `size`, `name`).    |
| `sortOrder`         | `string`   | `ascending`            | Sort order (`ascending` or `descending`).             |
| `logger`            | `boolean`  | `false`                | Enable or disable logging for the plugin.             |

---

## Recommendations
1. Use --legacy-peer-deps if Webpack version is lower then 5 for your current setup.

