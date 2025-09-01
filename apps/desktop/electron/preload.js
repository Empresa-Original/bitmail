import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('bitmail', {
  version: '0.1.0',
});
