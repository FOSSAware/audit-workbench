import { ipcMain } from 'electron';
import { IpcEvents } from '../ipc-events';
import { Search } from './Search/Search';
import { SearchEvents } from './Search/SearchEvents';
import { workspace } from './workspace/Workspace';

ipcMain.handle(IpcEvents.SEARCH, async (event, arg: string) => {
  const mailBox = event.sender;
  console.log('searching for: ', arg);

  const search: Search = new Search(arg, workspace.getOpenedProjects()[0].getScanRoot());
  search.search();
  search.on(SearchEvents.SEARCH_ON_RESULT, (response) => {
    mailBox.send(IpcEvents.SEARCH_RESPONSE, { data: response });
  });

  search.on(SearchEvents.SEARCH_FINISHED, () => {
    mailBox.send(IpcEvents.SEARCH_FINISHED, { data: 'finished' });
  });
});
