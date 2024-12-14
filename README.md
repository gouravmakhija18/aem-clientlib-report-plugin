# AEM Clientlib Details Plugin

This plugin analyzes client libraries in an AEM project and exports the details into a report. The name follows the convention `aem-clientlib-<something>`.


## How to Use

1. Place the `aem-clientlib-details-plugin.js` file in the `plugins` directory.
2. Import and configure the plugin in your Webpack configuration file (`webpack.config.js`).
3. Run your Webpack build to generate the clientlib report (e.g., `clientlib-report.xlsx`).

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

## Naming Convention

This plugin follows the naming convention `aem-clientlib-<something>`, ensuring clarity and consistency across AEM-related tools.
