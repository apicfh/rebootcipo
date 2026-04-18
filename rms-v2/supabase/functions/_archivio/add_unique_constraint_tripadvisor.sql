-- Aggiungi un unique constraint alla tabella tripadvisor_recensioni
ALTER TABLE tripadvisor_recensioni 
ADD CONSTRAINT tripadvisor_recensioni_review_id_unique 
UNIQUE (tripadvisor_review_id);

-- In alternativa, se vuoi un constraint composito che includa anche l'hotel_id
-- (nel caso improbabile che lo stesso ID recensione possa esistere per hotel diversi)
-- ALTER TABLE tripadvisor_recensioni 
-- ADD CONSTRAINT tripadvisor_recensioni_review_hotel_unique 
-- UNIQUE (tripadvisor_review_id, hotel_id);
