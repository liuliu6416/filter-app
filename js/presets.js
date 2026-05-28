/**
 * 滤镜预设 - Mamiya 67 + Portra 胶片风格
 *
 * 来源特征:
 * - Mamiya Sekor 镜头: 暖琥珀色调，红/橙色浓，深蓝色扎实
 * - Kodak Portra 胶片: 柔对比，粉彩色调，暗部有细节，高光柔和
 * - 6x7 中画幅: 影调过渡平滑，颗粒极细
 */
const FILTER_PRESET = {
  id: 'mamiya67',
  name: 'Mamiya 67',
  desc: '暖琥珀·柔对比·粉彩·中画幅胶片感',
  params: {
    brightness: 0.05,     // 略亮（Portra 正常曝光特征）
    contrast: 0.88,       // 柔对比（Portra 标志性柔和影调）
    saturation: -0.08,    // 轻微去饱和（粉彩/淡雅感）
    temperature: 1800,    // 暖琥珀色（Sekor 镜头暖黄镀膜 + Portra 暖调）
    tint: -6,             // 微偏绿（Portra 暗部特征性绿调）
    highlights: 0.78,     // 高光柔化（中画幅影调过渡平滑）
    shadows: 0.18,        // 暗部提亮（Portra 暗部细节保留）
    vignette: 0.12,       // 极轻微暗角（中画幅镜头特性）
    grain: 0.04,          // 极细颗粒（6x7 画幅几乎无颗粒感）
    sharpness: 0.03       // 轻微锐化（非临床锐度，保留柔和感）
  }
};
