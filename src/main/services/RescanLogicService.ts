import { utilHelper } from '../helpers/UtilHelper';
import { NodeStatus } from '../workspace/Tree/Tree/Node';

class ReScanService {
  public async reScan(resultPath: string, project: any, filteredFiles: Array<string>): Promise<void> {
    try {
      await project.scans_db.results.updateDirty(1);
      await project.scans_db.results.insertFromFileReScan(resultPath);
      if (filteredFiles.length > 0) {
        const filtered = utilHelper.convertsArrayOfStringToString(filteredFiles);
        await project.scans_db.results.updateFiltered(filtered);
      }
      const dirtyResults = await project.scans_db.results.getDirty();
      if (dirtyResults.length > 0) {
        await project.scans_db.inventories.deleteDirtyFileInventories(dirtyResults);
      }
      const notValidComp: number[] = await project.scans_db.components.getNotValid();

      if (notValidComp.length > 0) {
        await project.scans_db.components.deleteByID(notValidComp);
      }

      await project.scans_db.results.deleteDirty();
      await project.scans_db.components.updateOrphanToManual();
      await project.scans_db.components.importUniqueFromFile();

      const emptyInv: any = await project.scans_db.inventories.emptyInventory();
      if (emptyInv) {
        const result = emptyInv.map((item: Record<string, number>) => item.id);
        await project.scans_db.inventories.deleteAllEmpty(result);
      }
    } catch (err: any) {
      throw new Error('[ RESCAN DB ] Unable to insert new results');
    }
  }

  public async getNewResults(project: any): Promise<Array<any>> {
    const results: Array<any> = await project.scans_db.results.getResultsRescan();
    results.forEach((result) => {
      if (result.idtype === 'none' && result.identified === 1) {
        result[result.path] = NodeStatus.IDENTIFIED;
        result.status = NodeStatus.IDENTIFIED;
      } else if (result.idtype === 'none') {
        result[result.path] = NodeStatus.NOMATCH;
        result.status = NodeStatus.NOMATCH;
      } else if (result.identified === 1) {
        result[result.path] = NodeStatus.IDENTIFIED;
        result.status = NodeStatus.IDENTIFIED;
      } else if (result.ignored === 1) {
        result[result.path] = NodeStatus.IGNORED;
        result.status = NodeStatus.IGNORED;
      } else if (result.pending === 1) {
        result[result.path] = NodeStatus.PENDING;
        result.status = NodeStatus.PENDING;
      }
      // Set the original status of a file
      if (result.original === 'nomatch') result.original = NodeStatus.NOMATCH;
      else if (result.original === 'engine') result.original = NodeStatus.MATCH;
      else if (result.original === 'filtered') result.original = NodeStatus.FILTERED;
    });

    return results;
  }


}
export const reScanService = new ReScanService();