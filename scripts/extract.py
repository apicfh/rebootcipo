#!/usr/bin/env python3
import zipfile
import os
import subprocess
import sys

# Prova diversi percorsi
possible_paths = [
    'rms-v2.zip',
    './rms-v2.zip',
    '/vercel/share/v0-project/rms-v2.zip',
    '/home/user/rms-v2.zip',
    os.path.expanduser('~/rms-v2.zip'),
]

zip_path = None
for path in possible_paths:
    if os.path.exists(path):
        zip_path = os.path.abspath(path)
        print(f"✓ File trovato: {zip_path}")
        break

if not zip_path:
    print("✗ File rms-v2.zip non trovato in nessun percorso")
    print("Percorsi cercati:")
    for p in possible_paths:
        print(f"  - {p}")
    sys.exit(1)

# Estrai nella directory corrente di script
extract_dir = '/vercel/share/v0-project'
os.makedirs(extract_dir, exist_ok=True)

print(f"\nEstraendo in: {extract_dir}")
try:
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)
    
    print("✓ Estrazione completata!")
    
    # Mostra contenuto
    print("\nContenuto estratto:")
    for root, dirs, files in os.walk(extract_dir):
        level = root.replace(extract_dir, '').count(os.sep)
        if level > 3:
            break
        indent = ' ' * 2 * level
        folder_name = os.path.basename(root) or 'root'
        print(f'{indent}{folder_name}/')
        if level < 2:
            subindent = ' ' * 2 * (level + 1)
            for file in files[:8]:
                print(f'{subindent}{file}')
            if len(files) > 8:
                print(f'{subindent}... e {len(files) - 8} altri file')
                
except Exception as e:
    print(f"✗ Errore durante l'estrazione: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
