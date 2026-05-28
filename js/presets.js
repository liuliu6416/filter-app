/**
 * 滤镜预设 - 包含样片分析得出的参数
 */
const FILTER_PRESETS = [
  // === 0. 原图 ===
  {
    id: 'neutral',
    name: '原图',
    desc: '无效果',
    icon: '🔘',
    params: {
      brightness: 0,
      contrast: 1,
      saturation: 0,
      temperature: 0,
      tint: 0,
      highlights: 1,
      shadows: 0,
      vignette: 0,
      grain: 0,
      sharpness: 0
    }
  },

  // === 1. 暖调复古（从你的6张样片分析得出） ===
  {
    id: 'warm-retro',
    name: '暖调复古',
    desc: '暖色暗调·低饱和·强暗角',
    icon: '🎞️',
    params: {
      brightness: -0.23,
      contrast: 1.10,
      saturation: -0.22,
      temperature: 1500,
      tint: -5,
      highlights: 0.82,
      shadows: 0,
      vignette: 0.48,
      grain: 0.12,
      sharpness: 0.08
    }
  },

  // === 2. 暖调轻量 ===
  {
    id: 'warm-retro-light',
    name: '暖调轻量',
    desc: '轻暖调·适合人像',
    icon: '🌅',
    params: {
      brightness: -0.10,
      contrast: 1.05,
      saturation: -0.12,
      temperature: 800,
      tint: -3,
      highlights: 0.90,
      shadows: 0.05,
      vignette: 0.25,
      grain: 0.06,
      sharpness: 0.05
    }
  },

  // === 3. 黑白胶片 ===
  {
    id: 'bw-film',
    name: '黑白胶片',
    desc: '经典黑白·高对比·颗粒',
    icon: '🖤',
    params: {
      brightness: -0.05,
      contrast: 1.25,
      saturation: -1,
      temperature: 0,
      tint: 0,
      highlights: 0.75,
      shadows: 0.10,
      vignette: 0.40,
      grain: 0.18,
      sharpness: 0.10
    }
  },

  // === 4. 日系清新 ===
  {
    id: 'japanese-fresh',
    name: '日系清新',
    desc: '明亮·低对比·微偏青',
    icon: '☁️',
    params: {
      brightness: 0.15,
      contrast: 0.90,
      saturation: -0.08,
      temperature: -300,
      tint: 8,
      highlights: 0.85,
      shadows: 0.20,
      vignette: 0.10,
      grain: 0,
      sharpness: 0.05
    }
  },

  // === 5. 电影青橙 ===
  {
    id: 'teal-orange',
    name: '电影青橙',
    desc: '青蓝暗部·暖橙高光',
    icon: '🎬',
    params: {
      brightness: -0.08,
      contrast: 1.18,
      saturation: 0.10,
      temperature: 800,
      tint: -15,
      highlights: 0.80,
      shadows: 0.08,
      vignette: 0.35,
      grain: 0.08,
      sharpness: 0.10
    }
  },

  // === 6. 复古柯达 ===
  {
    id: 'kodak-gold',
    name: '柯达金',
    desc: '暖金黄·浓郁·胶片',
    icon: '📷',
    params: {
      brightness: -0.05,
      contrast: 1.12,
      saturation: 0.15,
      temperature: 2000,
      tint: 5,
      highlights: 0.78,
      shadows: 0.05,
      vignette: 0.30,
      grain: 0.15,
      sharpness: 0.06
    }
  },

  // === 7. 冷调电影 ===
  {
    id: 'cold-cinema',
    name: '冷调电影',
    desc: '蓝灰暗部·低饱和',
    icon: '🌙',
    params: {
      brightness: -0.15,
      contrast: 1.15,
      saturation: -0.25,
      temperature: -1000,
      tint: 5,
      highlights: 0.85,
      shadows: 0.10,
      vignette: 0.40,
      grain: 0.10,
      sharpness: 0.08
    }
  }
];
