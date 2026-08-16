import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Japanese font configuration
plt.rcParams['font.family'] = ['Yu Gothic', 'Meiryo', 'MS Gothic', 'sans-serif']

# Create a 1200x630 OGP card image
fig = plt.figure(figsize=(12, 6.3), dpi=100)
ax = fig.add_axes([0, 0, 1, 1])
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')
ax.axis('off')

# Background decorative rectangle
ax.add_patch(patches.Rectangle((0, 0), 1, 1, transform=ax.transAxes, color='#0f172a'))

# Top Category Badge
ax.text(0.08, 0.84, 'ニコニコ車載動画 分析アーカイブ', color='#38bdf8', fontsize=14, fontweight='bold',
        bbox=dict(boxstyle='round,pad=0.5', facecolor='#0369a1', edgecolor='#0284c7', alpha=0.3),
        transform=ax.transAxes)

# Main Title
ax.text(0.08, 0.63, 'ニコニコ車載動画\n初投稿年別＆活動状況データベース', color='#ffffff', fontsize=30, fontweight='bold',
        linespacing=1.35, transform=ax.transAxes)

# Subtitle
ax.text(0.08, 0.43, '歴代初投稿者 2,976名の初投稿・最新動画 ＆ 直近1年の活動状況を完全網羅', color='#94a3b8', fontsize=14,
        transform=ax.transAxes)

# Feature chips (no emojis to prevent missing glyph warnings)
chips = [
    ('2007〜2026年 全年度対応', '#1e293b', '#e2e8f0', '#334155'),
    ('直近1年活動中 858名 (28.8%)', '#064e3b', '#34d399', '#059669'),
    ('高速インクリメンタル検索', '#1e293b', '#e2e8f0', '#334155'),
]

x_positions = [0.08, 0.38, 0.70]
for (chip_text, bg_col, text_col, border_col), x_pos in zip(chips, x_positions):
    ax.text(x_pos, 0.24, f"  {chip_text}  ", color=text_col, fontsize=12, fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.6', facecolor=bg_col, edgecolor=border_col, linewidth=1.5),
            transform=ax.transAxes)

# Footer URL
ax.text(0.08, 0.09, 'https://estshorter.github.io/nico-onboard-viewer/', color='#64748b', fontsize=12,
        family='monospace', transform=ax.transAxes)

output_path = r"C:\Users\estshorter\src\nico-onboard-viewer\ogp.png"
plt.savefig(output_path, facecolor=fig.get_facecolor(), dpi=100)
plt.close()
print(f"Successfully generated clean OGP image: {output_path}")
