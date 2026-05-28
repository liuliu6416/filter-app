/**
 * 滤镜 PWA - 主应用逻辑
 */
class FilterApp {
  constructor() {
    this.originalImage = null;        // 原始图片 Image 对象
    this.currentPreset = null;        // 当前选中的滤镜预设
    this.customPresets = [];          // 用户保存的自定义滤镜
    this.activeParams = null;         // 当前正在编辑的参数（可已修改）
    this.previewTimeout = null;       // 防抖定时器
    this.isComparing = false;         // 是否在对比原图
    this.elements = {};

    this.init();
  }

  init() {
    this.cacheElements();
    this.loadCustomPresets();
    this.currentPreset = FILTER_PRESETS[1]; // 默认: 暖调复古
    this.activeParams = { ...this.currentPreset.params };
    this.renderFilterStrip();
    this.renderSliders();
    this.bindEvents();
    this.showHome();
  }

  cacheElements() {
    const ids = [
      'homeScreen', 'editorScreen',
      'btnCamera', 'btnGallery', 'fileInput',
      'editorImage', 'editorCanvas',
      'filterStrip', 'slidersPanel',
      'btnCompare', 'btnSave', 'btnReset',
      'btnToggleSliders', 'btnSavePreset', 'btnBack',
      'loadingOverlay', 'toast', 'btnInstall'
    ];
    ids.forEach(id => {
      this.elements[id] = document.getElementById(id);
    });
  }

  bindEvents() {
    // 首页按钮
    this.elements.btnCamera.addEventListener('click', () => this.openCamera());
    this.elements.btnGallery.addEventListener('click', () => this.elements.fileInput.click());
    this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // 编辑器工具栏
    this.elements.btnCompare.addEventListener('pointerdown', () => this.startCompare());
    this.elements.btnCompare.addEventListener('pointerup', () => this.endCompare());
    this.elements.btnCompare.addEventListener('pointerleave', () => this.endCompare());
    this.elements.btnSave.addEventListener('click', () => this.saveImage());
    this.elements.btnReset.addEventListener('click', () => this.resetParams());
    this.elements.btnToggleSliders.addEventListener('click', () => this.toggleSliders());
    this.elements.btnSavePreset.addEventListener('click', () => this.saveCustomPreset());
    this.elements.btnBack.addEventListener('click', () => this.showHome());

    // 安装按钮
    this.elements.btnInstall.addEventListener('click', () => this.installPWA());

    // 监听 PWA 安装事件
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.elements.btnInstall.style.display = 'block';
    });

    // 粘贴图片支持
    document.addEventListener('paste', (e) => {
      const item = e.clipboardData?.items?.[0];
      if (item?.type?.startsWith('image/')) {
        const file = item.getAsFile();
        this.loadImage(file);
      }
    });
  }

  // === 导航 ===

  showHome() {
    this.elements.homeScreen.style.display = 'flex';
    this.elements.editorScreen.style.display = 'none';
  }

  showEditor() {
    this.elements.homeScreen.style.display = 'none';
    this.elements.editorScreen.style.display = 'flex';
  }

  // === 图片加载 ===

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
        this.applyCurrentFilter();
        this.renderFilterStrip();
        this.showLoading(false);
        this.showToast('照片已加载');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // === 滤镜应用 ===

  applyCurrentFilter() {
    if (!this.originalImage) return;

    this.showLoading(true);

    // 使用 requestAnimationFrame 避免阻塞 UI
    requestAnimationFrame(() => {
      const canvas = FilterEngine.apply(
        this.originalImage,
        this.activeParams,
        1200 // 预览最大1200px
      );

      // 显示结果
      const imgEl = this.elements.editorImage;
      const canvasEl = this.elements.editorCanvas;

      // 同时设置 img src 和 canvas 备份
      canvasEl.width = canvas.width;
      canvasEl.height = canvas.height;
      canvasEl.getContext('2d').drawImage(canvas, 0, 0);
      imgEl.src = canvas.toDataURL('image/jpeg', 0.9);

      this.showLoading(false);
    });
  }

  schedulePreview() {
    if (this.previewTimeout) clearTimeout(this.previewTimeout);
    this.previewTimeout = setTimeout(() => {
      this.applyCurrentFilter();
    }, 80); // 80ms 防抖
  }

  // === 滤镜选择 ===

  selectPreset(preset) {
    this.currentPreset = preset;
    this.activeParams = { ...preset.params };
    this.renderSliders();
    this.applyCurrentFilter();
    this.highlightActiveFilter();
  }

  highlightActiveFilter() {
    const items = document.querySelectorAll('.filter-item');
    items.forEach(item => {
      item.classList.toggle('active', item.dataset.filterId === this.currentPreset.id);
    });
  }

  renderFilterStrip() {
    const strip = this.elements.filterStrip;
    const allPresets = [...FILTER_PRESETS, ...this.customPresets.map(p => ({
      ...p,
      isCustom: true
    }))];

    strip.innerHTML = '';

    allPresets.forEach((preset, index) => {
      const item = document.createElement('div');
      item.className = 'filter-item';
      item.dataset.filterId = preset.id;

      if (preset.id === this.currentPreset?.id) {
        item.classList.add('active');
      }

      // 生成缩略图（如果有原图）
      if (this.originalImage && preset.id !== 'neutral') {
        const thumb = FilterEngine.createThumbnail(this.originalImage, preset.params, 120);
        const img = document.createElement('img');
        img.src = thumb.toDataURL('image/jpeg', 0.7);
        img.alt = preset.name;
        item.appendChild(img);
      } else {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'filter-icon-placeholder';
        iconSpan.textContent = preset.icon || '🎨';
        item.appendChild(iconSpan);
      }

      const label = document.createElement('span');
      label.className = 'filter-label';
      label.textContent = preset.name;
      item.appendChild(label);

      item.addEventListener('click', () => {
        // 找到原始预设对象
        const originals = [...FILTER_PRESETS, ...this.customPresets];
        const found = originals.find(p => p.id === preset.id);
        if (found) {
          this.selectPreset({
            id: found.id,
            name: found.name,
            desc: found.desc || '',
            icon: found.icon || '🎨',
            params: found.params
          });
        }
      });

      strip.appendChild(item);
    });
  }

  // === 参数滑块 ===

  renderSliders() {
    const panel = this.elements.slidersPanel;
    const p = this.activeParams;

    const sliderDefs = [
      { key: 'brightness', label: '亮度', min: -1, max: 1, step: 0.01, default: 0 },
      { key: 'contrast', label: '对比度', min: 0.5, max: 2, step: 0.01, default: 1 },
      { key: 'saturation', label: '饱和度', min: -1, max: 1, step: 0.01, default: 0 },
      { key: 'temperature', label: '色温', min: -5000, max: 5000, step: 50, default: 0 },
      { key: 'tint', label: '色调', min: -5000, max: 5000, step: 50, default: 0 },
      { key: 'highlights', label: '高光', min: 0.3, max: 1, step: 0.01, default: 1 },
      { key: 'shadows', label: '阴影', min: 0, max: 0.5, step: 0.01, default: 0 },
      { key: 'vignette', label: '暗角', min: 0, max: 1, step: 0.01, default: 0 },
      { key: 'grain', label: '颗粒', min: 0, max: 0.5, step: 0.01, default: 0 },
      { key: 'sharpness', label: '锐度', min: 0, max: 0.3, step: 0.01, default: 0 }
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
      value.textContent = this.formatSliderValue(def.key, p[def.key]);

      const input = document.createElement('input');
      input.type = 'range';
      input.min = def.min;
      input.max = def.max;
      input.step = def.step;
      input.value = p[def.key];
      input.className = 'slider-input';
      input.dataset.key = def.key;

      const reset = document.createElement('button');
      reset.className = 'slider-reset';
      reset.textContent = '↺';
      reset.title = '重置';
      reset.addEventListener('click', () => {
        input.value = def.default;
        this.updateParam(def.key, parseFloat(def.default));
      });

      input.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        value.textContent = this.formatSliderValue(def.key, val);
        this.updateParam(def.key, val);
      });

      row.appendChild(label);
      row.appendChild(input);
      row.appendChild(value);
      row.appendChild(reset);
      panel.appendChild(row);
    });

    // 快捷预设按钮
    const quickRow = document.createElement('div');
    quickRow.className = 'quick-actions';
    quickRow.innerHTML = `
      <button class="btn-small" data-quick="brightness_up">🔆 提亮</button>
      <button class="btn-small" data-quick="contrast_up">◑ 加对比</button>
      <button class="btn-small" data-quick="warm">🔥 加暖</button>
      <button class="btn-small" data-quick="fade">💨 褪色</button>
    `;
    panel.appendChild(quickRow);

    // 快捷调整事件
    quickRow.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const quick = btn.dataset.quick;
        this.applyQuickAdjust(quick);
      });
    });
  }

  formatSliderValue(key, val) {
    if (key === 'temperature' || key === 'tint') {
      return Math.round(val);
    }
    if (key === 'contrast') {
      return val.toFixed(2);
    }
    return (val * 100).toFixed(0);
  }

  updateParam(key, value) {
    this.activeParams[key] = value;
    this.schedulePreview();
  }

  applyQuickAdjust(quick) {
    const p = this.activeParams;
    switch (quick) {
      case 'brightness_up':
        p.brightness = Math.min(1, p.brightness + 0.1);
        break;
      case 'contrast_up':
        p.contrast = Math.min(2, p.contrast + 0.1);
        break;
      case 'warm':
        p.temperature = Math.min(5000, p.temperature + 500);
        break;
      case 'fade':
        p.saturation = Math.max(-1, p.saturation - 0.1);
        p.contrast = Math.max(0.5, p.contrast - 0.05);
        break;
    }
    this.renderSliders();
    this.applyCurrentFilter();
  }

  toggleSliders() {
    const panel = this.elements.slidersPanel;
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
    this.elements.btnToggleSliders.textContent = isOpen ? '🎚️ 参数' : '✕ 收起';
  }

  resetParams() {
    this.activeParams = { ...this.currentPreset.params };
    this.renderSliders();
    this.applyCurrentFilter();
    this.showToast('已重置为默认参数');
  }

  // === 保存滤镜预设 ===

  saveCustomPreset() {
    const name = prompt('给这个滤镜起个名字：', '我的滤镜 ' + (this.customPresets.length + 1));
    if (!name) return;

    const preset = {
      id: 'custom-' + Date.now(),
      name: name,
      desc: '自定义滤镜',
      icon: '💾',
      params: { ...this.activeParams }
    };

    this.customPresets.push(preset);
    this.currentPreset = preset;
    this.saveCustomPresetsToStorage();
    this.renderFilterStrip();
    this.showToast('滤镜已保存: ' + name);
  }

  saveCustomPresetsToStorage() {
    try {
      localStorage.setItem('customFilterPresets', JSON.stringify(this.customPresets));
    } catch (e) {
      // storage full
    }
  }

  loadCustomPresets() {
    try {
      const data = localStorage.getItem('customFilterPresets');
      if (data) {
        this.customPresets = JSON.parse(data);
      }
    } catch (e) {
      this.customPresets = [];
    }
  }

  // === 对比原图 ===

  startCompare() {
    if (!this.originalImage) return;
    this.isComparing = true;
    this.elements.editorImage.src = this.originalImage.src;
    this.elements.btnCompare.style.opacity = '0.5';
  }

  endCompare() {
    if (!this.isComparing) return;
    this.isComparing = false;
    this.applyCurrentFilter();
    this.elements.btnCompare.style.opacity = '1';
  }

  // === 保存图片 ===

  saveImage() {
    if (!this.originalImage) return;

    this.showLoading(true);

    requestAnimationFrame(() => {
      const canvas = FilterEngine.apply(
        this.originalImage,
        this.activeParams,
        0 // 原尺寸
      );

      canvas.toBlob((blob) => {
        this.showLoading(false);

        // 尝试分享 API（手机上更好用）
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], 'filtered_photo.jpg', { type: 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) {
            navigator.share({
              files: [file],
              title: '保存滤镜照片'
            }).catch(() => {
              this.downloadBlob(blob);
            });
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

  // === PWA 安装 ===

  async installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const result = await this.deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        this.elements.btnInstall.style.display = 'none';
      }
      this.deferredPrompt = null;
    }
  }

  // === UI 辅助 ===

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

// 启动 App
document.addEventListener('DOMContentLoaded', () => {
  window.filterApp = new FilterApp();
});
