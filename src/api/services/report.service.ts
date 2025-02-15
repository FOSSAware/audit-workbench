import { IpcEvents } from '../ipc-events';
import { BaseService } from './base.service';
import { ISummary } from "../../main/services/ReportService";

const { ipcRenderer } = require('electron');

class ReportService extends BaseService {
  public async getSummary(args: string | null = null): Promise<ISummary> {
    const response = await ipcRenderer.invoke(IpcEvents.REPORT_SUMMARY, args);
    return this.response(response);
  }

  public async detected(args: string | null = null): Promise<any> {
    const response = await ipcRenderer.invoke(IpcEvents.REPORT_DETECTED, args);
    return this.response(response);
  }

  public async identified(): Promise<any> {
    const response = await ipcRenderer.invoke(IpcEvents.REPORT_IDENTIFIED);
    return this.response(response);
  }
}

export const reportService = new ReportService();
