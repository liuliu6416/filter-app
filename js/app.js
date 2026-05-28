/**
 * 滤镜 App - 只用一个暖调复古滤镜，可调参数
 */
class FilterApp {
  constructor() {
    this.originalImage = null;
    this.params = { ...FILTER_PRESET.params };
    this.previewTimeout = null;
    this.isComparing = false;
    this.elements = {};
    this.init();
  }

  init() {
    this.cacheElements();
    this.renderSliders();
    this.bindEvents();
    this.showHome();
  }

  cacheElements() {
    ['homeScreen', 'editorScreen', 'btnCamera', 'btnGallery', 'fileInput',
     'editorImage', 'editorCanvas', 'slidersPanel',
     'btnCompare', 'btnSave', 'btnReset', 'btnBack',
     'loadingOverlay', 'toast'].forEach(id => {
      this.elements[id] = document.getElementById(id);
    });
  }

  bindEvents() {
    this.elements.btnCamera.addEventListener('click', () => this.openCamera());
    this.elements.btnGallery.addEventListener('click', () => this.elements.fileInput.click());
    this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    this.elements.btnCompare.addEventListener('pointerdown', () => this.startCompare());
    this.elements.btnCompare.addEventListener('pointerup', () => this.endCompare());
    this.elements.btnCompare.addEventListener('pointerleave', () => this.endCompare());
    this.elements.btnSave.addEventListener('click', () => this.saveImage());
    this.elements.btnReset.addEventListener('click', () => this.resetParams());
    this.elements.btnBack.addEventListener('click', () => this.showHome());

    document.addEventListener('paste', (e) => {
      const item = e.clipboardData?.items?.[0];
      if (item?.type?.startsWith('image/')) {
        this.loadImage(item.getAsFile());
      }
    });
  }

  showHome() {
    this.elements.homeScreen.style.display = 'flex';
    this.elements.editorScreen.style.display = 'none';
  }

  showEditor() {
    this.elements.homeScreen.style.display = 'none';
    this.elements.editorScreen.style.display = 'flex';
  }

  openCamera() {
    const input = this.elements.fileInput;
    input.setAttribute('capture', 'environment');
    input.click();
    input.removeAttribute('capture');
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) this.loadImage(file);
    event.target.value = '';
  }

  loadImage(file) {
    this.showLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.originalImage = img;
        this.showEditor();
        this.applyFilter();
        this.showLoading(false);
        this.showToast('照片已加载，滤镜已应用');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  applyFilter() {
    if (!this.originalImage) return;
    this.showLoading(true);
    requestAnimationFrame(() => {
      const canvas = FilterEngine.apply(this.originalImage, this.params, 1200);
      const canvasEl = this.elements.editorCanvas;
      canvasEl.width = canvas.width;
      canvasEl.height = canvas.height;
      canvasEl.getContext('2d').drawImage(canvas, 0, 0);
      this.elements.editorImage.src = canvas.toDataURL('image/jpeg', 0.9);
      this.showLoading(false);
    });
  }

  schedulePreview() {
    if (this.previewTimeout) clearTimeout(this.previewTimeout);
    this.previewTimeout = setTimeout(() => this.applyFilter(), 80);
  }

  renderSliders() {
    const panel = this.elements.slidersPanel;
    const p = this.params;

    const sliderDefs = [
      { key: 'brightness', label: '亮度', min: -1, max: 1, step: 0.01, default: FILTER_PRESET.params.brightness },
      { key: 'contrast', label: '对比度', min: 0.5, max: 2, step: 0.01, default: FILTER_PRESET.params.contrast },
      { key: 'saturation', label: '饱和度', min: -1, max: 1, step: 0.01, default: FILTER_PRESET.params.saturation },
      { key: 'temperature', label: '色温', min: -5000, max: 5000, step: 50, default: FILTER_PRESET.params.temperature },
      { key: 'tint', label: '色调', min: -5000, max: 5000, step: 50, default: FILTER_PRESET.params.tint },
      { key: 'highlights', label: '高光', min: 0.3, max: 1, step: 0.01, default: FILTER_PRESET.params.highlights },
      { key: 'shadows', label: '阴影', min: 0, max: 0.5, step: 0.01, default: FILTER_PRESET.params.shadows },
      { key: 'vignette', label: '暗角', min: 0, max: 1, step: 0.01, default: FILTER_PRESET.params.vignette },
      { key: 'grain', label: '颗粒', min: 0, max: 0.5, step: 0.01, default: FILTER_PRESET.params.grain },
      { key: 'sharpness', label: '锐度', min: 0, max: 0.3, step: 0.01, default: FILTER_PRESET.params.sharpness }
    ];

    panel.innerHTML = '';

    sliderDefs.forEach(def => {
      const row = document.createElement('div');
      row.className = 'slider-row';

      const label = document.createElement('label');
      label.textContent = def.label;
      label.className = 'slider-label';

      const value = document.createElement('span');
      value.className = 'slider-value';
      value.textContent = this.formatValue(def.key, p[def.key]);

      const input = document.createElement('input');
      input.type = 'range';
      input.min = def.min;
      input.max = def.max;
      input.step = def.step;
      input.value = p[def.key];
      input.className = 'slider-input';

      const reset = document.createElement('button');
      reset.className = 'slider-reset';
      reset.textContent = '↺';
      reset.addEventListener('click', () => {
        input.value = def.default;
        this.updateParam(def.key, def.default);
      });

      input.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        value.textContent = this.formatValue(def.key, val);
        this.updateParam(def.key, val);
      });

      row.appendChild(label);
      row.appendChild(input);
      row.appendChild(value);
      row.appendChild(reset);
      panel.appendChild(row);
    });
  }

  formatValue(key, val) {
    if (key === 'temperature' || key === 'tint') return Math.round(val);
    if (key === 'contrast') return val.toFixed(2);
    return (val * 100).toFixed(0);
  }

  updateParam(key, value) {
    this.params[key] = value;
    this.schedulePreview();
  }

  resetParams() {
    this.params = { ...FILTER_PRESET.params };
    this.renderSliders();
    this.applyFilter();
    this.showToast('已重置为默认参数');
  }

  startCompare() {
    if (!this.originalImage) return;
    this.isComparing = true;
    this.elements.editorImage.src = this.originalImage.src;
    this.elements.btnCompare.style.opacity = '0.5';
  }

  endCompare() {
    if (!this.isComparing) return;
    this.isComparing = false;
    this.applyFilter();
    this.elements.btnCompare.style.opacity = '1';
  }

  saveImage() {
    if (!this.originalImage) return;
    this.showLoading(true);
    requestAnimationFrame(() => {
      const canvas = FilterEngine.apply(this.originalImage, this.params, 0);
      canvas.toBlob((blob) => {
        this.showLoading(false);
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], 'filtered_photo.jpg', { type: 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: '保存照片' }).catch(() => this.downloadBlob(blob));
            return;
          }
        }
        this.downloadBlob(blob);
      }, 'image/jpeg', 0.95);
    });
  }

  downloadBlob(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filtered_photo.jpg';
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('照片已保存');
  }

  showLoading(show) {
    this.elements.loadingOverlay.style.display = show ? 'flex' : 'none';
  }

  showToast(message) {
    const toast = this.elements.toast;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.filterApp = new FilterApp();
});
