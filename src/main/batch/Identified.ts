import { ComponentSource, FileStatusType, FileUsageType, Inventory } from '../../api/types';
import { QueryBuilder } from '../model/queryBuilder/QueryBuilder';
import { QueryBuilderCreator } from '../model/queryBuilder/QueryBuilderCreator';
import { inventoryService } from '../services/InventoryService';
import { NodeStatus } from '../workspace/tree/Node';
import { workspace } from '../workspace/Workspace';
import { Batch } from './Batch';
import { Restore } from './Restore';

export class Identified extends Batch {
  private inventory: Partial<Inventory>;

  private queryBuilder: QueryBuilder;

  constructor(folder: string, params: boolean, inventory: Partial<Inventory>) {
    super(folder, params);
    this.inventory = inventory;
    const filter = workspace.getOpenedProjects()[0].getGlobalFilter();
    this.queryBuilder = QueryBuilderCreator.create({
      ...filter,
      path: this.getFolder(),
      source: ComponentSource.ENGINE,
    });
  }

  public async execute() {
    try {
      if (this.getOverWrite()) {
        await new Restore(this.getFolder(), this.getOverWrite()).execute();
      }
      const ids = (await this.getFilesToProcess(this.queryBuilder, 'id')) as Array<number>;
      this.inventory.files = ids;
      const success = await inventoryService.create(this.inventory);
      this.updateTree(ids, NodeStatus.IDENTIFIED);

      if (success) return success;

      throw new Error('[ INVENTORY FOLDER] error on identified files service');
    } catch (error: any) {
      return error;
    }
  }
}
