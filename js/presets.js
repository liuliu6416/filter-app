/**
 * 滤镜预设 - 从6张样片分析得出
 * 风格: 明亮柔和 · 暖黄调 · 低对比 · 无暗角
 */
const FILTER_PRESET = {
  id: 'warm-natural',
  name: '暖调柔光',
  desc: '明亮 · 柔和低对比 · 暖黄调',
  params: {
    brightness: 0.10,     // 略微提亮
    contrast: 0.95,       // 柔和低对比
    saturation: -0.05,    // 轻微去饱和
    temperature: 1200,    // 暖黄偏色（暖冷比~1.20）
    tint: 0,              // 色调中性
    highlights: 0.85,     // 高光略压
    shadows: 0.12,        // 阴影提亮
    vignette: 0,          // 无暗角
    grain: 0,             // 无颗粒
    sharpness: 0          // 无额外锐化
  }
};
