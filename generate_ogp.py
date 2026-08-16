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

# Background clean dark rectangle
ax.add_patch(patches.Rectangle((0, 0), 1, 1, transform=ax.transAxes, color='#0f172a'))

# Top Category Badge (Clean & Subtle)
ax.text(0.1, 0.78, 'NICODE ARCHIVE', color='#38bdf8', fontsize=15, fontweight='bold',
        bbox=dict(boxstyle='round,pad=0.5', facecolor='#0284c7', edgecolor='#38bdf8', alpha=0.2, linewidth=1),
        transform=ax.transAxes)

# Main Title (The Core Message)
ax.text(0.1, 0.50, 'ニコニコ車載動画\n初投稿年別＆活動状況データベース', color='#ffffff', fontsize=40, fontweight='bold',
        linespacing=1.35, transform=ax.transAxes)

# Subtitle (Minimal context)
ax.text(0.1, 0.32, '歴代初投稿者の初投稿・最新動画 ＆ 活動状況アーカイブ', color='#94a3b8', fontsize=18,
        transform=ax.transAxes)

# Subtle URL / Footer
ax.text(0.1, 0.14, 'https://estshorter.github.io/nico-onboard-viewer/', color='#475569', fontsize=13,
        family='monospace', transform=ax.transAxes)

output_path = r"C:\Users\estshorter\src\nico-onboard-viewer\ogp.png"
plt.savefig(output_path, facecolor=fig.get_facecolor(), dpi=100)
plt.close()
print(f"Successfully generated clean minimal OGP image: {output_path}")
