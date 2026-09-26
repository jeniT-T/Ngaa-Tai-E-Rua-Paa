

DO $$
DECLARE
  opening_id INTEGER;
  closing_id INTEGER;
BEGIN
  INSERT INTO checklists (title, description)
  VALUES ('Opening', 'Handover steps for opening the Paa for a booking.')
  RETURNING id INTO opening_id;

  INSERT INTO checklist_items (checklist_id, text, position) VALUES
    (opening_id, 'Unlock the front gate', 0),
    (opening_id, 'Unlock Te Whare Manaaki O Te Puea', 1),
    (opening_id, 'Ensure Te Arikinui Room is locked', 2),
    (opening_id, 'Ensure the mattress room is open', 3),
    (opening_id, 'Ensure there is a vacuum available', 4),
    (opening_id, 'Ensure the linen cupboard is full', 5),
    (opening_id, 'Make sure nothing is blocking the exit door', 6),
    (opening_id, 'Raise the flag', 7),
    (opening_id, 'Setup the tangihanga prep, where applicable', 8),
    (opening_id, 'Unlock toilet block: unlock womens', 9),
    (opening_id, 'Check cleaning bottle for surfaces', 10),
    (opening_id, 'Check cleaning bottle for toilets', 11),
    (opening_id, 'Check cleaning bottle for toilet floors', 12),
    (opening_id, 'Check cleaning bottle for windows', 13),
    (opening_id, 'Unlock disability toilet', 14),
    (opening_id, 'Check the brooms are available', 15),
    (opening_id, 'Ensure the cleaning room is locked', 16),
    (opening_id, 'Unlock mens toilet', 17),
    (opening_id, 'Check the mops are hanging up (back of the kitchen room)', 18),
    (opening_id, 'Turn on the gas bottles for toilet block, ensure both are on', 19),
    (opening_id, 'Unlock the back gate', 20),
    (opening_id, 'Turn on the gas bottles for kitchen, check levels', 21),
    (opening_id, 'Open up the kitchen: turn on lights', 22),
    (opening_id, 'Turn on hot water switch', 23),
    (opening_id, 'Check cleaning bottle for surfaces (kitchen)', 24),
    (opening_id, 'Check cleaning bottle for kitchen floor', 25),
    (opening_id, 'Check cleaning bottle for dining floors', 26),
    (opening_id, 'Check cleaning bottle for windows (kitchen)', 27),
    (opening_id, 'Check cleaning bottle for tough surfaces', 28),
    (opening_id, 'Ensure appliances work', 29),
    (opening_id, 'Ensure there is a kai bucket', 30),
    (opening_id, 'Walk around the Paa, ensure all is tidy', 31),
    (opening_id, 'Sign agreement', 32),
    (opening_id, 'Hand over keys', 33);

  INSERT INTO checklists (title, description)
  VALUES ('Closing', 'Handover steps for closing the Paa after a booking.')
  RETURNING id INTO closing_id;

  INSERT INTO checklist_items (checklist_id, text, position) VALUES
    (closing_id, 'Lock the front gate', 0),
    (closing_id, 'Lock Te Whare Manaaki O Te Puea', 1),
    (closing_id, 'Ensure Te Arikinui Room is locked', 2),
    (closing_id, 'Ensure the mattress room is open', 3),
    (closing_id, 'Ensure there is a vacuum available', 4),
    (closing_id, 'Ensure the linen is placed in the bag', 5),
    (closing_id, 'Make sure nothing is blocking the exit door', 6),
    (closing_id, 'Bring down the flag', 7),
    (closing_id, 'Setup the tangihanga prep, where applicable', 8),
    (closing_id, 'Lock toilet block: lock womens toilet', 9),
    (closing_id, 'Check cleaning bottle for surfaces', 10),
    (closing_id, 'Check cleaning bottle for toilets', 11),
    (closing_id, 'Check cleaning bottle for toilet floors', 12),
    (closing_id, 'Check cleaning bottle for windows', 13),
    (closing_id, 'Lock disability toilet', 14),
    (closing_id, 'Check the brooms are available', 15),
    (closing_id, 'Ensure the cleaning room is locked', 16),
    (closing_id, 'Lock mens toilet', 17),
    (closing_id, 'Check the mops are hanging up (back of the kitchen room)', 18),
    (closing_id, 'Turn off the gas bottles for toilet block, ensure both are off', 19),
    (closing_id, 'Lock the back gate', 20),
    (closing_id, 'Turn off the gas bottles for kitchen, check levels — order new bottles if needed', 21),
    (closing_id, 'Close up the kitchen: turn off lights', 22),
    (closing_id, 'Turn off hot water switch', 23),
    (closing_id, 'Check cleaning bottle for surfaces (kitchen)', 24),
    (closing_id, 'Check cleaning bottle for kitchen floor', 25),
    (closing_id, 'Check cleaning bottle for dining floors', 26),
    (closing_id, 'Check cleaning bottle for windows (kitchen)', 27),
    (closing_id, 'Check cleaning bottle for tough surfaces', 28),
    (closing_id, 'Ensure appliances are turned off', 29),
    (closing_id, 'Ensure kai bucket is emptied', 30),
    (closing_id, 'Walk around the Paa, ensure all is tidy', 31),
    (closing_id, 'Return keys to the back gate', 32);
END $$;
