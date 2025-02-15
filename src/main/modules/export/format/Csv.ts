/* eslint-disable no-restricted-syntax */
import { CsvAdapter } from '../../../task/export/format/formatAdapter/CsvAdapter';
import { Format } from '../Format';

export class Csv extends Format {
  constructor() {
    super();
    this.extension = '.csv';
  }

  private csvCreate(data: any) {
    let csv = `inventory_ID,usage,notes,identified_license,detected_license,identified_component,detected_component,path,purl,version\r\n`;
    for (const inventory of data) {
      csv += `${inventory.inventoryId},${inventory.usage || ''},${inventory.notes || ''},${
        inventory.identified_license
      },${inventory.detected_license.length > 0 ? inventory.detected_license.join(' ') : 'n/a'},${
        inventory.identified_component
      },${inventory.detected_component ? inventory.detected_component : 'n/a'},"${inventory.path || ''}","${
        inventory.purl
      }",${inventory.version}\r\n`;
    }
    return csv;
  }

  // @override
  public async generate() {
    const data = await this.export.getCsvData();
    const csvData = new CsvAdapter().adapt(data);
    const csv = this.csvCreate(csvData);
    return csv;
  }
}
