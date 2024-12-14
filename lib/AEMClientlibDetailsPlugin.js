const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const xml2js = require('xml2js');
const ExcelJS = require('exceljs');

class AemClientlibDetailsPlugin {
  constructor(options) {
    this.uiAppsPath = options.uiAppsPath;
    this.additionalData = options.additionalData || [];
    this.exportToExcel = options.exportToExcel || false;
    this.outputFilePath = options.outputFilePath || 'clientlib-report.xlsx';
    this.isPluginInitialized = false; // Ensure the plugin logic runs only once
    this.hidePath = options.hidePath || false; // Option to hide the clientlib Path column
    this.excludeDirectories = options.excludeDirectories || []; // Directories to exclude
    this.sortBy = options.sortBy || 'size'; // Default to sorting by size
    this.sortOrder = options.sortOrder || 'ascending'; // Default to ascending
    this.logger = options.logger || false; // Default not to display clientlib log
  }

  apply(compiler) {
    compiler.hooks.beforeCompile.tapAsync('AemClientlibDetailsPlugin', async (compilation, callback) => {
      if (this.isPluginInitialized) {
        callback();
        return;
      }

      this.isPluginInitialized = true; // Prevent further execution
      if (!fs.existsSync(this.uiAppsPath)) {
        console.error(`The provided path does not exist: ${this.uiAppsPath}`);
        callback();
        return;
      }

      const clientlibData = [];

      const searchClientlibs = async (dir) => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const fullPath = path.resolve(dir, file);
          const stats = fs.statSync(fullPath);

          // Get the relative path from the root directory
          const relativePath = path.relative(this.uiAppsPath, fullPath);

          // Skip directories that match any entry in `excludeDirectories` based on original relative path
          if (
            stats.isDirectory() &&
            this.excludeDirectories.some((excludedDir) => {
              // Strip "ui.apps" from the path before matching
              const strippedPath = relativePath.replace(/^ui\.apps\//, '');
              return strippedPath.startsWith(excludedDir) || excludedDir === strippedPath;
            })
          ) {
            continue; // Skip this directory
          }

          // Prepend "ui.apps" to the relative path for output
          const finalPath = path.join('ui.apps', relativePath); // Prepend "ui.apps" to relative paths for output

          if (stats.isFile() && file === '.content.xml') {
            const xmlContent = fs.readFileSync(fullPath, 'utf8');
            if (this.logger){
              console.log(`Reading file: ${fullPath}`);
            }
            const isClientlib = await this.isClientLibraryFolder(xmlContent);

            if (isClientlib) {
              const clientlibName = path.basename(dir);
              const compressedSize = this.calculateCompressedSize(dir);
              const clientlibDetails = await this.extractClientlibDetails(xmlContent);

              const additionalDetails = this.getAdditionalDetails(clientlibDetails);

              clientlibData.push({
                name: clientlibName,
                path: finalPath, // Use the updated path for output
                compressedSize,
                ...additionalDetails,
              });
            }
          } else if (stats.isDirectory()) {
            await searchClientlibs(fullPath);
          }
        }
      };

      await searchClientlibs(this.uiAppsPath);

      // Sort the data based on sort configuration
      if (this.sortBy === 'size') {
        clientlibData.sort((a, b) => {
          if (this.sortOrder === 'ascending') {
            return a.compressedSize - b.compressedSize;
          } else {
            return b.compressedSize - a.compressedSize;
          }
        });
      } else if (this.sortBy === 'clientname') {
        clientlibData.sort((a, b) => {
          if (this.sortOrder === 'ascending') {
            return a.name.localeCompare(b.name);
          } else {
            return b.name.localeCompare(a.name);
          }
        });
      }

      if (this.exportToExcel) {
        await this.exportToExcelFile(clientlibData);
        console.log(`Excel file successfully written to: ${this.outputFilePath}`);
      } else {
        console.log('Client Library Details:');
        console.table(
          clientlibData.map(({ name, path, compressedSize, ...details }) => ({
            Name: name,
            ...(this.hidePath ? {} : { Path: path }), // Conditionally include Path column
            'Compressed Size': `${(compressedSize / 1024).toFixed(2)} KB`,
            ...details,
          }))
        );
      }

      callback();
    });
  }

  async isClientLibraryFolder(xmlContent) {
    const parser = new xml2js.Parser();
    try {
      const result = await parser.parseStringPromise(xmlContent);
      const jcrPrimaryType = result['jcr:root']?.['$']?.['jcr:primaryType'] || null;
      return jcrPrimaryType === 'cq:ClientLibraryFolder';
    } catch (err) {
      console.error('Error parsing XML content:', err);
      return false;
    }
  }

  calculateCompressedSize(dir) {
    let totalSize = 0;

    const calculateSize = (folder) => {
      const items = fs.readdirSync(folder);

      items.forEach((item) => {
        const itemPath = path.join(folder, item);
        const stats = fs.statSync(itemPath);

        if (stats.isFile()) {
          const fileContent = fs.readFileSync(itemPath);
          const compressed = zlib.gzipSync(fileContent);
          totalSize += compressed.length;
        } else if (stats.isDirectory()) {
          calculateSize(itemPath);
        }
      });
    };

    calculateSize(dir);
    return totalSize;
  }

  async extractClientlibDetails(xmlContent) {
    const parser = new xml2js.Parser();
    const details = {};

    try {
      const result = await parser.parseStringPromise(xmlContent);
      const jcrRoot = result['jcr:root']?.['$'];

      if (jcrRoot) {
        this.additionalData.forEach((prop) => {
          if (jcrRoot[prop]) {
            details[prop] = this.parseArrayProperty(jcrRoot[prop]);
          }
        });
      }
    } catch (err) {
      console.error('Error extracting clientlib details:', err);
    }

    return details;
  }

  parseArrayProperty(value) {
    if (typeof value === 'string') {
      return [value];
    } else if (Array.isArray(value)) {
      return value.map((item) => item.trim());
    }
    return [];
  }

  getAdditionalDetails(clientlibDetails) {
    const additionalDetails = {};
    this.additionalData.forEach((prop) => {
      if (clientlibDetails[prop]) {
        additionalDetails[prop] = Array.isArray(clientlibDetails[prop])
          ? clientlibDetails[prop].join(',\n')
          : clientlibDetails[prop];
      }
    });
    return additionalDetails;
  }

  async exportToExcelFile(clientlibData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Client Library Details');

    // Add header row
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      ...(this.hidePath ? [] : [{ header: 'Path', key: 'path', width: 50 }]), // Conditionally add Path column
      { header: 'Compressed Size (KB)', key: 'compressedSize', width: 20 },
      ...this.additionalData.map((prop) => ({ header: prop, key: prop, width: 50 })),
    ];

    // Add rows
    clientlibData.forEach(({ name, path, compressedSize, ...details }) => {
      worksheet.addRow({
        name,
        ...(this.hidePath ? {} : { path }), // Conditionally include Path column
        compressedSize: parseFloat((compressedSize / 1024).toFixed(2)), // Convert to KB
        ...details,
      });
    });

    // Save file
    await workbook.xlsx.writeFile(this.outputFilePath);
  }
}

export default AemClientlibDetailsPlugin;
