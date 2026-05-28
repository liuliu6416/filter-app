/**
 * 滤镜引擎 - Canvas 像素级图像处理
 * 所有参数与 iOS Core Image 保持一致
 */
class FilterEngine {
  /**
   * 对图片应用滤镜预设
   * @param {ImageBitmap|HTMLImageElement|HTMLCanvasElement} source - 源图片
   * @param {Object} preset - 滤镜参数对象
   * @param {number} [maxDimension=0] - 输出最大尺寸(0=不缩放)
   * @returns {HTMLCanvasElement}
   */
  static apply(source, preset, maxDimension = 0) {
    const srcW = source.width || source.naturalWidth;
    const srcH = source.height || source.naturalHeight;
    let w = srcW, h = srcH;

    if (maxDimension > 0 && Math.max(w, h) > maxDimension) {
      const scale = maxDimension / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // 绘制原图
    ctx.drawImage(source, 0, 0, w, h);

    // 获取像素数据
    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data;

    // === 按顺序应用所有效果 ===

    // 1. 亮度 (-1 ~ 1)
    if (Math.abs(preset.brightness) > 0.001) {
      FilterEngine._adjustBrightness(pixels, preset.brightness);
    }

    // 2. 对比度 (0.25 ~ 4, 默认1)
    if (Math.abs(preset.contrast - 1) > 0.001) {
      FilterEngine._adjustContrast(pixels, preset.contrast);
    }

    // 3. 饱和度 (-1 ~ 1)
    if (Math.abs(preset.saturation) > 0.001) {
      FilterEngine._adjustSaturation(pixels, preset.saturation);
    }

    // 4. 色温和色调
    if (Math.abs(preset.temperature) > 1 || Math.abs(preset.tint) > 1) {
      FilterEngine._adjustWhiteBalance(pixels, preset.temperature, preset.tint);
    }

    // 5. 高光压暗
    if (Math.abs(preset.highlights - 1) > 0.001) {
      FilterEngine._adjustHighlights(pixels, preset.highlights);
    }

    // 6. 阴影提亮
    if (Math.abs(preset.shadows) > 0.001) {
      FilterEngine._adjustShadows(pixels, preset.shadows);
    }

    // 写回像素
    ctx.putImageData(imageData, 0, 0);

    // 7. 暗角 (在 canvas 层面画)
    if (preset.vignette > 0.001) {
      FilterEngine._drawVignette(ctx, w, h, preset.vignette);
    }

    // 8. 颗粒
    if (preset.grain > 0.001) {
      FilterEngine._drawGrain(ctx, w, h, preset.grain);
    }

    // 9. 锐化
    if (preset.sharpness > 0.001) {
      FilterEngine._sharpen(ctx, w, h, preset.sharpness);
    }

    return canvas;
  }

  // ---- 像素级操作 ----

  static _adjustBrightness(pixels, amount) {
    // amount: -1 to 1, maps to -64 to 64 value shift
    const shift = amount * 64;
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = Math.max(0, Math.min(255, pixels[i] + shift));
      pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + shift));
      pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + shift));
    }
  }

  static _adjustContrast(pixels, amount) {
    // amount: contrast factor, 1 = no change
    const factor = amount;
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = Math.max(0, Math.min(255, (pixels[i] - 128) * factor + 128));
      pixels[i + 1] = Math.max(0, Math.min(255, (pixels[i + 1] - 128) * factor + 128));
      pixels[i + 2] = Math.max(0, Math.min(255, (pixels[i + 2] - 128) * factor + 128));
    }
  }

  static _adjustSaturation(pixels, amount) {
    // amount: -1 to 1 (0 = no change)
    const factor = 1 + amount;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      // 使用 Rec.709 亮度权重
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      pixels[i] = Math.max(0, Math.min(255, gray + (r - gray) * factor));
      pixels[i + 1] = Math.max(0, Math.min(255, gray + (g - gray) * factor));
      pixels[i + 2] = Math.max(0, Math.min(255, gray + (b - gray) * factor));
    }
  }

  static _adjustWhiteBalance(pixels, temperature, tint) {
    // temperature: warm/cool, positive = warm (more red, less blue)
    // tint: green/magenta, positive = green, negative = magenta
    const tempR = 1 + temperature / 15000;  // red channel
    const tempB = 1 - temperature / 15000;  // blue channel
    const tintG = 1 + tint / 15000;         // green channel

    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = Math.max(0, Math.min(255, pixels[i] * tempR));
      pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] * tintG));
      pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] * tempB));
    }
  }

  static _adjustHighlights(pixels, amount) {
    // amount: 0-1, 1=no change, 0=fully crushed
    for (let i = 0; i < pixels.length; i += 4) {
      const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      if (lum > 128) {
        const factor = (lum - 128) / 127; // 0 to 1 in highlights
        const reduction = factor * (1 - amount);
        pixels[i] = Math.max(0, Math.min(255, pixels[i] - reduction * 80));
        pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] - reduction * 80));
        pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] - reduction * 80));
      }
    }
  }

  static _adjustShadows(pixels, amount) {
    // amount: 0-1, 0=no change, 1=fully lifted
    for (let i = 0; i < pixels.length; i += 4) {
      const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      if (lum < 128) {
        const factor = (128 - lum) / 128; // 0 to 1 in shadows
        const lift = factor * amount;
        pixels[i] = Math.max(0, Math.min(255, pixels[i] + lift * 60));
        pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + lift * 60));
        pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + lift * 60));
      }
    }
  }

  // ---- Canvas 级别效果 ----

  static _drawVignette(ctx, w, h, intensity) {
    const cx = w / 2, cy = h / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    // 创建径向渐变暗角
    const gradient = ctx.createRadialGradient(cx, cy, maxDist * 0.3, cx, cy, maxDist);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.4, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${intensity + 0.05})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  static _drawGrain(ctx, w, h, intensity) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const noise = (Math.random() - 0.5) * intensity * 40;
      pixels[i] = Math.max(0, Math.min(255, pixels[i] + noise));
      pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + noise));
      pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + noise));
    }

    ctx.putImageData(imageData, 0, 0);
  }

  static _sharpen(ctx, w, h, amount) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const src = new Uint8ClampedArray(imageData.data);
    const kernel = [
      0, -1, 0,
      -1, 4 + amount * 8, -1,
      0, -1, 0
    ];
    const kernelSum = kernel.reduce((a, b) => a + b, 0);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let val = 0;
          let ki = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * w + (x + kx)) * 4 + c;
              val += src[idx] * kernel[ki++];
            }
          }
          val = val / kernelSum + src[(y * w + x) * 4 + c] * (1 - 1 / kernelSum);
          const idx = (y * w + x) * 4 + c;
          imageData.data[idx] = Math.max(0, Math.min(255, val));
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 创建滤镜预览缩略图
   * @param {HTMLImageElement} image - 原图
   * @param {Object} preset - 滤镜参数
   * @param {number} size - 缩略图尺寸
   * @returns {HTMLCanvasElement}
   */
  static createThumbnail(image, preset, size = 150) {
    return FilterEngine.apply(image, preset, size);
  }
}
