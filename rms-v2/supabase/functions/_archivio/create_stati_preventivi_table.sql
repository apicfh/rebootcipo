-- Creazione della tabella di lookup per gli stati dei preventivi
CREATE TABLE IF NOT EXISTS stati_preventivi (
  id INTEGER PRIMARY KEY,
  descrizione TEXT NOT NULL,
  categoria TEXT NOT NULL
);

-- Inserimento dei valori degli stati
INSERT INTO stati_preventivi (id, descrizione, categoria) VALUES
(1, 'elaborato non letto', 'in elaborazione'),
(2, 'elaborato letto', 'in elaborazione'),
(3, 'opzionato in attesa di conferma', 'in attesa'),
(4, 'prenotato in attesa di caparra', 'prenotato'),
(5, 'prenotato con caparra confirmatoria', 'prenotato'),
(6, 'preventivo scaduto mai confermato', 'scaduto'),
(99, 'preventivo annullato', 'annullato')
ON CONFLICT (id) DO UPDATE SET 
  descrizione = EXCLUDED.descrizione,
  categoria = EXCLUDED.categoria;

-- Aggiunta di una foreign key alla tabella preventivi_elaborati
-- Nota: Questa operazione potrebbe richiedere una migrazione se ci sono già dati esistenti
-- ALTER TABLE preventivi_elaborati ADD CONSTRAINT fk_stato_preventivo FOREIGN KEY (stato) REFERENCES stati_preventivi(id);
