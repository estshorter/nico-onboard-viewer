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

# Main Title (Large, Bold, Centered, Perfectly Balanced)
ax.text(0.5, 0.50, 'ニコニコ車載動画\n初投稿年別＆活動状況データベース', color='#ffffff', fontsize=42, fontweight='bold',
        ha='center', va='center', linespacing=1.4, transform=ax.transAxes)

output_path = r"C:\Users\estshorter\src\nico-onboard-viewer\ogp.png"
plt.savefig(output_path, facecolor=fig.get_facecolor(), dpi=100)
plt.close()
print(f"Successfully generated clean title-only OGP image: {output_path}")
