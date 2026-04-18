import shutil
import os

# Rimuove le cartelle di cache
paths_to_remove = ['.next', '.turbo', 'node_modules/.cache']

for path in paths_to_remove:
    if os.path.exists(path):
        try:
            shutil.rmtree(path)
            print(f"Rimossa cartella: {path}")
        except Exception as e:
            print(f"Errore rimozione {path}: {e}")
    else:
        print(f"Cartella non trovata: {path}")

print("Pulizia completata")
