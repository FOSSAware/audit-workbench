import React, { useContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import ChevronRightOutlinedIcon from '@material-ui/icons/ChevronRightOutlined';
import { WorkbenchContext, IWorkbenchContext } from '../../../../store';
import { Inventory } from '../../../../../../../api/types';
import { FileList } from '../ComponentList/components/FileList';
import { ComponentInfo } from '../../../../components/ComponentInfo/ComponentInfo';
import { componentService } from '../../../../../../../api/component-service';

import { IdentifiedList } from '../ComponentList/components/IdentifiedList';
import { DialogContext, IDialogContext } from '../../../../../../context/DialogProvider';
import { DIALOG_ACTIONS } from '../../../../../../context/types';
import { MATCH_CARD_ACTIONS } from '../../../../components/MatchCard/MatchCard';
import { mapFiles } from '../../../../../../../utils/scan-util';
import { setHistoryCrumb, setVersion } from '../../../../actions';
import Breadcrumb from '../../../../components/Breadcrumb/Breadcrumb';
import SearchBox from '../../../../../../components/SearchBox/SearchBox';
import TabNavigation from './components/TabNavigation/TabNavigation';
import ActionButton from './components/ActionButton/ActionButton';
import VersionSelector from './components/VersionSelector/VersionSelector';

const TABS = {
  pending: '0',
  identified: '1',
  original: '2',
};

export const ComponentDetail = () => {
  const history = useHistory();

  const { state, dispatch, detachFile, createInventory, ignoreFile, restoreFile } = useContext(
    WorkbenchContext
  ) as IWorkbenchContext;
  const dialogCtrl = useContext(DialogContext) as IDialogContext;

  const { component, version, filter } = state;

  const [files, setFiles] = useState<any[]>([]);
  const [filterFiles, setFilterFiles] = useState<{ pending: any[]; identified: any[]; ignored: any[] }>({
    pending: [],
    identified: [],
    ignored: [],
  });

  const [tab, setTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const getFiles = async () => {
    const response = await componentService.getFiles({ purl: component.purl, version }, { status: null });
    setFiles(mapFiles(response.data));
  };

  const onAction = async (file: any, action: MATCH_CARD_ACTIONS) => {
    switch (action) {
      case MATCH_CARD_ACTIONS.ACTION_ENTER:
        history.push({
          pathname: '/workbench/detected/file',
          search: `?path=file|${encodeURIComponent(file.path)}`,
        });
        break;
      case MATCH_CARD_ACTIONS.ACTION_IDENTIFY:
        await onIdentifyPressed(file);
        break;
      case MATCH_CARD_ACTIONS.ACTION_IGNORE:
        await onIgnorePressed(file);
        break;
      case MATCH_CARD_ACTIONS.ACTION_DETACH:
        await onDetachPressed(file);
        break;
      case MATCH_CARD_ACTIONS.ACTION_RESTORE:
        await onRestorePressed(file);
        break;
      case MATCH_CARD_ACTIONS.ACTION_DETAIL:
        await onDetailPressed(file);
        break;
      default:
        break;
    }

    getFiles();
  };

  const onIdentifyPressed = async (result) => {

    console.log('identify', result);
    // result is "file join result"
    const inv: Partial<Inventory> = {
      component: result.componentName,
      url: result.url,
      purl: result.purl,
      version: result.version,
      spdxid: result.license ? result.license[0] : null,
      usage: result.type,
    };

    create(inv, [result.id]);
  };

  const onIdentifyAllPressed = async () => {
    const selFiles = filterFiles.pending.map((file) => file.id);

    const inv: Partial<Inventory> = {
      component: component?.name,
      version: version || component?.versions[0]?.version,
      spdxid: component?.versions[0].licenses[0]?.spdxid,
      url: component?.url,
      purl: component?.purl,
      usage: 'file',
    };

    await create(inv, selFiles);
  };

  const onIgnorePressed = async (file) => {
    await ignoreFile([file.id]);
  };

  const onIgnoreAllPressed = async () => {
    const { action } = await dialogCtrl.openConfirmDialog(
      `Are you sure you want to ignore ${filterFiles.pending.length} ${
        filterFiles.pending.length === 1 ? 'file' : 'files'
      }?`
    );
    if (action === DIALOG_ACTIONS.OK) {
      const selFiles = filterFiles.pending.map((file) => file.id);
      await ignoreFile(selFiles);
    }
  };

  const onRestoreAllPressed = async () => {
    const { action } = await dialogCtrl.openConfirmDialog(
      `Are you sure you want to restore ${filterFiles.ignored.length} ${
        filterFiles.ignored.length === 1 ? 'file' : 'files'
      }?`
    );

    if (action === DIALOG_ACTIONS.OK) {
      const selFiles = filterFiles.ignored.map((file) => file.id);
      await restoreFile(selFiles);
    }
  };

  const onDetachAllPressed = async () => {
    const { action } = await dialogCtrl.openConfirmDialog(
      `Are you sure you want to restore ${filterFiles.identified.length} ${
        filterFiles.identified.length === 1 ? 'file' : 'files'
      }?`
    );
    if (action === DIALOG_ACTIONS.OK) {
      const selFiles = filterFiles.identified.map((file) => file.id);
      await detachFile(selFiles);
    }
  };

  const onDetachPressed = async (file) => {
    await detachFile([file.id]);
  };

  const onRestorePressed = async (file) => {
    await restoreFile([file.id]);
  };

  const onDetailPressed = async (file) => {
    history.push(`/workbench/identified/inventory/${file.inventoryid}`);
  };

  const create = async (defaultInventory, selFiles) => {
    const inventory = await dialogCtrl.openInventory(defaultInventory, state.recentUsedComponents);
    if (!inventory) return;

    const newInventory = await createInventory({
      ...inventory,
      files: selFiles,
    });
  };

  useEffect(() => {
    if (!files) return;
    setFilterFiles({
      pending: files.filter((file) => file.status === 'pending'),
      identified: files.filter((file) => file.status === 'identified'),
      ignored: files.filter((file) => file.status === 'ignored'),
    });
  }, [files]);

  useEffect(() => {
    const nTab = TABS[state.filter?.status] || state.history.section || tab || TABS.pending;
    console.log('component detail', nTab, state.history.section);

    setTab(parseInt(nTab, 10));
  }, [state.filter]);

  useEffect(() => {
    setFilterFiles({
      pending: [],
      identified: [],
      ignored: [],
    });
    getFiles();
  }, [state.version, state.node]);

  useEffect(() => {
    setFilterFiles({
      pending: files.filter((file) => file.path.toLowerCase().includes(searchQuery) && file.status === 'pending'),
      identified: files.filter((file) => file.path.toLowerCase().includes(searchQuery) && file.status === 'identified'),
      ignored: files.filter((file) => file.path.toLowerCase().includes(searchQuery) && file.status === 'ignored'),
    });
  }, [searchQuery, files]);

  useEffect(() => {
    getFiles();
  }, [state.summary]);

  useEffect(() => {
    dispatch(setHistoryCrumb({ section: tab }));
  }, [tab]);

  const renderTab = () => {
    switch (tab) {
      case 0:
        return (
          <FileList
            files={filterFiles.pending}
            emptyMessage={searchQuery ? `No pending files found with "${searchQuery}"` : 'No pending files'}
            onAction={onAction}
          />
        );
      case 1:
        return (
          <IdentifiedList
            files={filterFiles.identified}
            emptyMessage={searchQuery ? `No identified files found with "${searchQuery}"` : 'No identified files'}
            onAction={onAction}
          />
        );
      case 2:
        return (
          <FileList
            files={filterFiles.ignored}
            emptyMessage={searchQuery ? `No original files found with "${searchQuery}"` : 'No original files'}
            onAction={onAction}
          />
        );
      default:
        return 'no data';
    }
  };

  return (
    <>
      <section id="ComponentDetail" className="app-page">
        <header className="app-header">
          <div className="header">
            <Breadcrumb />
            <div className="filter-container">
              <ComponentInfo component={component} />
              <ChevronRightOutlinedIcon fontSize="small" />
              <VersionSelector
                versions={component?.versions}
                version={version}
                onSelect={(version) => dispatch(setVersion(version))}
                component={component}
              />
            </div>
          </div>

          <section className="subheader">
            <div className="search-box">
              <SearchBox onChange={(value) => setSearchQuery(value.trim().toLowerCase())} />
            </div>

            <div className="tab-navigation">
              <TabNavigation
                tab={tab}
                version={version}
                query={searchQuery}
                component={component}
                filterFiles={filterFiles}
                onSelect={(tab) => setTab(tab)}
              />

              <ActionButton
                tab={tab}
                files={filterFiles}
                onIdentifyAllPressed={onIdentifyAllPressed}
                onIgnoreAllPressed={onIgnoreAllPressed}
                onRestoreAllPressed={onRestoreAllPressed}
                onDetachAllPressed={onDetachAllPressed}
              />
            </div>
          </section>
        </header>

        <main className="app-content">{filterFiles && renderTab()}</main>
      </section>
    </>
  );
};

export default ComponentDetail;
