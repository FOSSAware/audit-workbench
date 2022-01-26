import { CircularProgress, Input, InputLabel } from '@material-ui/core';
import React, { useContext, useEffect } from 'react';
import { Redirect, Route, Switch, useLocation, useRouteMatch } from 'react-router-dom';
import SplitPane from 'react-split-pane';

import { dialogController } from '../../dialog-controller';

import { WorkbenchContext, IWorkbenchContext } from './store';
import { AppContext, IAppContext } from '../../context/AppProvider';
import AppBar from './components/AppBar/AppBar';
import Detected from './pages/detected/Detected';
import Identified from './pages/identified/Identified';
import Reports from './pages/report/Report';
import FileTree from './components/FileTree/FileTree';
import { searchService } from '../../../api/search-service';
import { IpcEvents } from '../../../ipc-events';
import { finished } from 'stream';

const { ipcRenderer } = require('electron');

const Workbench = () => {
  const { path } = useRouteMatch();

  const { pathname } = useLocation();

  const { state, loadScan } = useContext(WorkbenchContext) as IWorkbenchContext;
  const { scanPath } = useContext(AppContext) as IAppContext;

  const [word, setWord] = React.useState('');

  const { loaded } = state;

  const report = pathname.startsWith('/workbench/report');

  const onInit = async () => {
    const { path } = scanPath;
    ipcRenderer.on(IpcEvents.SEARCH_RESPONSE, handlerSearch);
    ipcRenderer.on(IpcEvents.SEARCH_FINISHED, searchFinished);
    const result = path ? await loadScan(path) : false;
    if (!result) {
      dialogController.showError('Error', 'Cannot read scan.');
    }
  };

  const onDestroy = () => {};

  useEffect(() => {
    onInit();
    return onDestroy;
  }, []);

  const handleChange = async (event) => {
    setWord(event.target.value);
    console.log("Start searching");
    const results = await searchService.search(event.target.value);


    
  
  };


  const handlerSearch = (_event, results) => {
   
  };

  const searchFinished = (_event, results) => {
    console.log("Search finished",results);
  };

  return (
    <div>
      <AppBar />
      <SplitPane
        split="vertical"
        minSize={280}
        maxSize={450}
        defaultSize={300}
        pane1Style={report ? { display: 'none' } : {}}
      >
        <aside className="panel explorer">
        <InputLabel htmlFor="component-simple">Search</InputLabel>
        <Input id="component-simple" value={word} onChange={handleChange} />
          <div className="file-tree-container">
            <FileTree />
          </div>
        </aside>
        <main id="Workbench" className="match-info">
          {loaded ? (
            <Switch>
              <Route path={`${path}/identified`} component={Identified} />
              <Route path={`${path}/detected`} component={Detected} />
              <Route path={`${path}/report`} component={Reports} />

              <Redirect from={path} to={`${path}/detected`} />
            </Switch>
          ) : (
            <div className="loader">
              <CircularProgress size={30} />
            </div>
          )}
        </main>
      </SplitPane>
    </div>
  );
};

export default Workbench;
