import Vue from 'vue';
import electron from 'electron';
import { Component } from 'vue-property-decorator';
import { OverlaysPersistenceService } from '../services/config-persistence';
import { CacheUploaderService } from '../services/cache-uploader';
import { Inject } from '../util/injector';

@Component({})
export default class ExtraSettings extends Vue {

  @Inject('OverlaysPersistenceService')
  overlaysService: OverlaysPersistenceService;

  @Inject()
  cacheUploaderService: CacheUploaderService;

  overlaySaving = false;

  cacheUploading = false;

  showCacheDir() {
    electron.remote.shell.showItemInFolder(electron.remote.app.getPath('userData'));
  }

  deleteCacheDir() {
    if (confirm('WARNING! You will lose all scenes, sources, and settings. This cannot be undone!')) {
      electron.remote.app.relaunch({ args: ['--clearCacheDir'] });
      electron.remote.app.quit();
    }
  }

  uploadCacheDir() {
    this.cacheUploading = true;
    this.cacheUploaderService.uploadCache().then(file => {
      electron.remote.clipboard.writeText(file);
      alert(`Your cache directory has been successfully uploaded.  The file name ${file} has been copied to your clipboard.  Please paste it into discord and tag a developer.`);
      this.cacheUploading = false;
    });
  }

  exportOverlay() {
    const path = electron.remote.dialog.showSaveDialog({
      filters: [{ name: 'Overlay File', extensions: ['overlay'] }]
    });

    if (!path) return;

    this.overlaySaving = true;

    this.overlaysService.saveOverlay(path).then(() => {
      this.overlaySaving = false;
    });
  }

}