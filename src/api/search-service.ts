import { IpcEvents } from '../ipc-events';
import { BaseService } from './base-service';

const { ipcRenderer } = require('electron');

class SearchService extends BaseService {
  public async search(word: string): Promise<any> {
    const response = await ipcRenderer.invoke(IpcEvents.SEARCH, word);
    return response;
  }

  public async searchByIndex(word: string): Promise<any> {
    const response = await ipcRenderer.invoke(IpcEvents.SEARCH_BY_INDEX, word);
   
    return response;
  }
}

export const searchService = new SearchService();
