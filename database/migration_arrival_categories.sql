-- Migration: Map old arrival guide categories to new 7-category system
-- Old system: arrival, general, leaving
-- New system: arrival, essentials, kitchen, equipment, facilities, maintenance, cleaning

-- Update categories based on keywords in title/body
UPDATE content_items SET category = 'arrival' 
WHERE placement = 'arrival' AND category IN ('arrival', 'general', 'leaving')
AND (LOWER(title) LIKE '%emergency%' OR LOWER(title) LIKE '%safety%' 
     OR LOWER(body) LIKE '%emergency%' OR LOWER(body) LIKE '%evacuation%');

UPDATE content_items SET category = 'essentials' 
WHERE placement = 'arrival' AND category IN ('arrival', 'general', 'leaving')
AND (LOWER(title) LIKE '%wifi%' OR LOWER(title) LIKE '%parking%' 
     OR LOWER(title) LIKE '%check%' OR LOWER(body) LIKE '%wifi%');

UPDATE content_items SET category = 'kitchen' 
WHERE placement = 'arrival' AND category IN ('arrival', 'general', 'leaving')
AND (LOWER(title) LIKE '%kitchen%' OR LOWER(title) LIKE '%cook%' 
     OR LOWER(title) LIKE '%oven%' OR LOWER(title) LIKE '%fridge%'
     OR LOWER(title) LIKE '%hangi%' OR LOWER(body) LIKE '%kitchen%');

UPDATE content_items SET category = 'equipment' 
WHERE placement = 'arrival' AND category IN ('arrival', 'general', 'leaving')
AND (LOWER(title) LIKE '%chair%' OR LOWER(title) LIKE '%table%' 
     OR LOWER(title) LIKE '%trolley%' OR LOWER(title) LIKE '%vacuum%'
     OR LOWER(title) LIKE '%defibrillator%' OR LOWER(body) LIKE '%equipment%');

UPDATE content_items SET category = 'facilities' 
WHERE placement = 'arrival' AND category IN ('arrival', 'general', 'leaving')
AND (LOWER(title) LIKE '%toilet%' OR LOWER(title) LIKE '%shower%' 
     OR LOWER(title) LIKE '%bathroom%' OR LOWER(title) LIKE '%facility%'
     OR LOWER(body) LIKE '%facilities%');

UPDATE content_items SET category = 'maintenance' 
WHERE placement = 'arrival' AND category IN ('arrival', 'general', 'leaving')
AND (LOWER(title) LIKE '%heating%' OR LOWER(title) LIKE '%cooling%' 
     OR LOWER(title) LIKE '%water%' OR LOWER(title) LIKE '%electricity%'
     OR LOWER(title) LIKE '%air%' OR LOWER(body) LIKE '%utilities%');

-- Everything else that was "general" or "leaving" falls back to essentials (safe default)
UPDATE content_items SET category = 'essentials' 
WHERE placement = 'arrival' AND category IN ('arrival', 'general', 'leaving');
