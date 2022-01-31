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

const Workbench = () => {
  const { path } = useRouteMatch();

  const { pathname } = useLocation();

  const { state, loadScan } = useContext(WorkbenchContext) as IWorkbenchContext;
  const { scanPath } = useContext(AppContext) as IAppContext;

  const [query, setQuery] = React.useState('');
  const [word, setWord] = React.useState('');

  const { loaded } = state;

  const report = pathname.startsWith('/workbench/report');

  const onInit = async () => {
    const { path } = scanPath;
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

  useEffect(() => {
    const timeOutId = setTimeout(() => setWord(query), 500);
    return () => clearTimeout(timeOutId);
  }, [query]);

  useEffect(() => {
    search(word);
  }, [word]);

  const search = async (word) => {
    if (word !== '') {
      const { data } = await searchService.searchByIndex(word);
      console.log('Search results:', data);
    }
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
          <Input id="component-simple" value={query} onChange={(event) => setQuery(event.target.value)} />
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
