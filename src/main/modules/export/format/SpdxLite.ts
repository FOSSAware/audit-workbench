import { workspace } from '../../../workspace/Workspace';
import { Format } from '../Format';

export class SpdxLite extends Format {
  constructor() {
    super();
    this.extension = '.SPDXLite.spdx';
  }

  // @override
  public async generate() {
    const data = await this.export.getSpdxData();
    let spdxLite = SpdxLite.templateHeader();
    let body = '';
    for (let i = 0; i < data.length; i += 1) {
      const bodyTemplate = `PackageName: ${data[i].name}\nPackageVersion: ${
        data[i].version
      }\nPackageFileName:-\nPackageDownloadLocation: ${data[i].purl}\nFilesAnalyzed: false\nPackageHomePage: ${
        data[i].url
      }\nConcludedLicense: ${
        data[i].license_name !== undefined ? data[i].license_name : data[i].license_name
      }\nPackageLicenseInfoFromFiles: ${data[i].license_name}\nDeclaredLicense: ${
        data[i].declareLicense
      }\nCommentsonLicense:${data[i].notes !== 'n/a' ? data[i].notes : '-'}\nCopyrightText: - \n\r`;

      body += `${bodyTemplate}`;
    }
    spdxLite += `${body}`;
    return spdxLite;
  }

  private static templateHeader() {
    const template = `DocumentName: ${workspace
      .getOpenedProjects()[0]
      .getProjectName()}\nDocumentNamespace: https://example.com/example-v1.0\nCreator: Person: SCANOSS Inventory Engine', 'Organization: http://scanoss.com'\n\r`;
    return template;
  }
}
