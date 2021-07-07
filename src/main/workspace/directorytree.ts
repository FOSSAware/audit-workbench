/* eslint-disable max-classes-per-file */
import { EventEmitter } from 'events';
// import { eventNames } from 'process';
/* const aFilter=require('./salida')
 const blist =require('./salida') */
// import * as Emmiter from 'events';

import * as Filtering from './filtering';

const fs = require('fs');
const path = require('path');

// const { EventEmitter } = require('events');

const cont = 0;

function prepareScan(jsonScan: any, bannedList: Filtering.BannedList) {
  let i = 0;
  // console.log
  if (jsonScan.type === 'file') {
    if (bannedList.evaluate(jsonScan.path)) {
      jsonScan.action = 'scan';
      //  console.log("scan->"+jsonScan.path)
    } else {
      // console.log("filter->"+jsonScan.name)
      jsonScan.action = 'filter';
    }
  } else if (jsonScan.type === 'folder') {
    for (i = 0; i < jsonScan.childs.length; i += 1)
      prepareScan(jsonScan.childs[i], bannedList);
  }
}

function dirTree(filename: string) {
  // console.log(filename)
  const stats = fs.lstatSync(filename);
  let info;

  if (stats.isDirectory()) {
    info = {
      type: 'folder',
      //path: filename,
      name: path.basename(filename),
      inventories: [],
      components: [],
      childs: undefined,
      include: true,
      action: 'scan',
    };

    info.childs = fs.readdirSync(filename).map(function (child: string) {
      return dirTree(`${filename}/${child}`);
    });
  } else {
    info = {
      type: 'file',
      inv_count: 0,
     // path:filename,
      name: path.basename(filename),
      inventories: [],
      components: [],
      include: true,
      action: 'scan',
    };
  }
  return info;
}
export class ProjectTree extends EventEmitter {
  project_root: string;

  project_name: string;

  // onBuiltTree?: (msg: any) => void;
  project: any;

  constructor(name: string) {
    super();
    this.project_root = '';
    this.project_name = name;
  }

  set_project_root(root: string) {
    this.project_root = root;
  }

  build_tree() {
    this.project = dirTree(this.project_root);
    this.emit('treeBuilt', this.project);
  }

  get_proxy_leaf(leaf: any): any {
    if (leaf.type === 'file') return leaf;

    let j = 0;
    const ret = {
      type: 'folder',
      name: leaf.name,
      inv_count: leaf.inv_count,
      include: leaf.include,
      childs: [],
      action: leaf.action,
    };
    ret.childs = [];
    const childs = [];
    for (j = 0; leaf.childs && j < leaf.childs.length; j += 1) {
      if (leaf.childs[j].type === 'folder') {
        const info = {
          type: 'folder',
          path: leaf.childs[j].name,
          inv_count: leaf.childs[j].inv_count,
          include: leaf.childs[j].include,
          action: leaf.childs[j].action,
        };
        childs.push(info);
      } else if (leaf.childs[j].type === 'file') {
        const info = {
          type: 'file',
          path: leaf.childs[j].name,
          inventories: leaf.childs[j].inventories,
          include: leaf.childs[j].include,
          action: leaf.childs[j].action,
        };
        childs.push(info);
      }
    }
    Object.assign(ret.childs, childs);
    return ret;
  }
}