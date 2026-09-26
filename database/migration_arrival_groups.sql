
UPDATE content_items
SET category = 'arrival', updated_at = NOW()
WHERE placement = 'arrival' AND title IN (
  'Defibrillator',
  'Evacuation Point',
  'First Aid',
  'Flag / Kara',
  'WiFi',
  'Parking'
);

UPDATE content_items
SET category = 'leaving', updated_at = NOW()
WHERE placement = 'arrival' AND title IN (
  'Clean – Final Dining Hall',
  'Clean – Final Kitchen',
  'Clean – Final Toilets',
  'Clean – Final Wharenui'
);


UPDATE content_items
SET category = 'general', updated_at = NOW()
WHERE placement = 'arrival' AND category NOT IN ('arrival', 'leaving');
