import { CancelPresentationOutlined } from '@material-ui/icons';
import { ipcMain } from 'electron';
import { IpcEvents } from '../ipc-events';
import { Search } from './Search/Search';
import { SearchEvents } from './Search/SearchEvents';
import { workspace } from './workspace/Workspace';

ipcMain.handle(IpcEvents.SEARCH, async (event, arg: string) => {
  const mailBox = event.sender;
  console.log('searching for: ', arg);
  console.log('searching for: ', workspace.getOpenedProjects()[0].getScanRoot());

  const search: Search = new Search(arg, workspace.getOpenedProjects()[0].getScanRoot());
  search.search();
  search.on(SearchEvents.SEARCH_ON_RESULT, (response) => {
    mailBox.send(IpcEvents.SEARCH_RESPONSE, { data: response });
  });

  search.on(SearchEvents.SEARCH_FINISHED, (response) => {
    mailBox.send(IpcEvents.SEARCH_FINISHED, { data: 'FINISHED' });
  });
});

ipcMain.handle(IpcEvents.SEARCH_BY_INDEX, async (event, arg: string) => {
  const search = new Search(null, workspace.getOpenedProjects()[0].getScanRoot())
  const result = search.searchIndex(arg);
 // console.log(result);
  
  return {
    status: 'ok',
    message: 'Results succesfully retrieved',
    data: result,
  };
});
