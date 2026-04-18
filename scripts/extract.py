import zipfile
import os
import subprocess

# Extract the zip
print("Extracting rms-v2.zip...")
with zipfile.ZipFile('/vercel/share/v0-project/rms-v2.zip', 'r') as zip_ref:
    zip_ref.extractall('/vercel/share/v0-project')

print("Extraction complete!")

# List extracted files
for root, dirs, files in os.walk('/vercel/share/v0-project'):
    level = root.replace('/vercel/share/v0-project', '').count(os.sep)
    indent = ' ' * 2 * level
    print(f'{indent}{os.path.basename(root)}/')
    if level < 2:  # Only show first 2 levels
        subindent = ' ' * 2 * (level + 1)
        for file in files[:5]:  # Show first 5 files
            print(f'{subindent}{file}')
