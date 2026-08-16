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

# Subtle left accent bar
ax.add_patch(patches.Rectangle((0.10, 0.32), 0.008, 0.36, transform=ax.transAxes, color='#38bdf8'))

# Main Title (Left-aligned, Modern & Clean typography)
ax.text(0.13, 0.50, 'ニコニコ ボイロ（広義）車載動画\n初投稿年別＆活動状況データベース', color='#ffffff', fontsize=36, fontweight='bold',
        ha='left', va='center', linespacing=1.35, transform=ax.transAxes)

output_path = r"C:\Users\estshorter\src\nico-onboard-viewer\ogp.png"
plt.savefig(output_path, facecolor=fig.get_facecolor(), dpi=100)
plt.close()
print(f"Successfully generated smart left-aligned OGP image: {output_path}")
