

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Our History',
  $body$Ngaa Tai e Rua Paa takes its name from a hostel built in 1929 by Te Puea Herangi — "ngaa tai o te raawhiti, ngaa tai o te hauaauru" (the tides of the east, the tides of the west). What began as a place of manaaki for travellers passing through Tuakau has grown into the wharenui, wharekai and grounds you see today.$body$,
  'general', 'history', 'heading'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'history' AND block_type = 'heading'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Taiporutu and Tamaiwaho Kukutai',
  $body$In 1912, Taiporutu and Tamaiwaho Kukutai purchased the whenua that Ngaa Tai e Rua Paa now stands on. Some of that land was later sold on to the Muir family, and the Kukutai whaanau and their whaangai tamariki moved to Tuakau, leaving Te Kotahitanga (the Kumi Paa) for the whaanau of that area. They lived on George Street, across the road from the Tuakau Council building.$body$,
  'general', 'history', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'history' AND title = 'Taiporutu and Tamaiwaho Kukutai'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Te Puea Herangi and the Hostel',
  $body$In 1929, Te Puea Herangi laid the foundation stone for the "Hostel" on 28 September, marking the occasion with a pōwhiri for Āpirana Ngata. It was Te Puea who named this gathering Ngaa Tai e Rua Paa. The Hostel was a whare manaaki for everyone travelling into Tuakau from Te Puaha, Waikaretu, Te Paina, Kaiaua, Pukekawa and Te Kohanga — a place to rest for the night before heading home.

"Mehemea ka moemoeaa ahau, ko ahau anahe. Mehemea ka moemoeaa taatou, ka taea e taatou."
If I am to dream, I dream alone. If we all dream together, then we shall achieve.
— Te Puea Herangi$body$,
  'general', 'history', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'history' AND title = 'Te Puea Herangi and the Hostel'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Reitu and the growth of the Paa',
  $body$As the years went on, papakāinga homes were built for the Kukutai whaanau's eight whaangai tamariki, and work began on a wharekai. When it was completed, Rev. Motu Kapa named it "Reituu" in 1931.

In 2005, Te Arikinui Te Atairangikaahu opened Wharekai Reitu II at Poukai, 74 years after the original wharekai. In 2017, at Poukai, Kiingi Tuheitia Pootatau Te Wherowhero VII opened the tupuna whare, Te Whare Manaaki o Te Puea — 88 years after Te Puea laid the foundation stone for the original Hostel.$body$,
  'general', 'history', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'history' AND title = 'Reitu and the growth of the Paa'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Legal status and purpose',
  $body$Ngaa Tai e Rua Paa (Lots 6-9 IV DP 7325) sits on an 8961 m² site at 16 Carr Street, Tuakau. The Paa Trustees hold it as a Māori Reservation trust established by the Māori Land Court on 9 July 1970, subject to Te Ture Whenua Māori Act 1993 and the Trusts Act 2019.

The Paa exists to provide a place for hui, tangihanga, karakia and hui-ā-tau; to uphold Waikato-Tainui kawa and protect the Kiingitanga; to carry the whakapapa and kōrero of the Paa and its beneficiaries; and to support the cultural, spiritual, physical, educational and recreational wellbeing of Ngaati Tiipa hapū, whaanau and beneficiaries who whakapapa to the Paa.$body$,
  'general', 'history', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'history' AND title = 'Legal status and purpose'
);

-- ============================================================
-- Health & Safety page — generic rules from the Hire Agreement's
-- Schedule Four (no names, phone numbers or financial details).
-- ============================================================

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Health & Safety',
  $body$In an emergency, call 111 for an ambulance, fire, police, or to report a water, sewerage or gas leak. Everyone hiring or visiting the Paa is expected to know the evacuation exits, the assembly point, and where the fire extinguishers and first aid kit are kept.$body$,
  'general', 'health-and-safety', 'heading'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'health-and-safety' AND block_type = 'heading'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Prohibited on site',
  $body$Alcohol, drugs, dogs and gang regalia are not permitted anywhere on the Ngaa Tai e Rua Paa property, including the car park. Smoking is not permitted on the marae ātea, on the grounds, or inside any building — the designated smoking area is at the rear of Te Puna Kai o Reitu, by the green toilets.$body$,
  'health_safety', 'health-and-safety', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'health-and-safety' AND title = 'Prohibited on site'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Fire and evacuation',
  $body$The hirer is responsible for briefing their group, visitors and whaanau on the evacuation exits and assembly point before or at the start of any event, and for knowing where the fire extinguishers are located in both Te Puna Kai o Reitu and Te Whare Manaaki o Te Puea.

Evacuation exits:
• Te Puna Kai side, green gate north of Reitu Puna Kai
• Te Wharenui pathway to the waharoa of the Paa
• Ngaa Whareiti pathway to the waharoa of the Paa

The assembly point is the front carpark. The hirer must appoint a designated fire and safety warden for their event — a warden vest is hanging near the storeroom entrance in the kitchen. In a fire, the warden activates the fire alarm, ensures everyone has left the buildings, and shuts down the main electrical switch and external gas connections once everyone is out.$body$,
  'health_safety', 'health-and-safety', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'health-and-safety' AND title = 'Fire and evacuation'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'First aid',
  $body$A qualified first aid person must be present on site for the whole hire period. In a medical emergency, call for an ambulance — the first aid person should assist until it arrives. The first aid kit is kept on the shelf in the kitchen next to the hot water, and in the mattress room. If supplies are used, please note this in the booklet provided so they can be replenished.$body$,
  'health_safety', 'health-and-safety', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'health-and-safety' AND title = 'First aid'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Earthquake',
  $body$A tremor usually announces itself with a rumble as the roof or lights start to shake — when that happens, DROP, COVER AND HOLD. If you're inside, stay inside: get under a sturdy table or bench and cover your head and neck. If you're caught outside, stay clear of anything overhead and curl up covering your head and neck if there's no shelter nearby. If you're already sheltering somewhere and it starts to move, move with it.$body$,
  'health_safety', 'health-and-safety', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'health-and-safety' AND title = 'Earthquake'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Emergency lockdown',
  $body$The hirer is responsible for briefing their group on lockdown procedures. The designated fire and safety warden makes contact with Police and notifies whaanau in every area of the Paa that a lockdown is in place. Everyone should keep low to the ground and stay away from doors and windows until the warden confirms it's safe.$body$,
  'health_safety', 'health-and-safety', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'health-and-safety' AND title = 'Emergency lockdown'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Illness',
  $body$If you or anyone in your group is unwell — especially with something contagious — please stay home rather than attending the Paa. This applies to tangihanga, weddings, birthdays, wānanga and school visits alike. Look after each other: be safe, take care, and don't share illness.$body$,
  'health_safety', 'health-and-safety', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'health-and-safety' AND title = 'Illness'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Unsupervised children',
  $body$The wharenui, kitchen, dining room and toilets are not appropriate places for children to play unsupervised. A parent or caregiver must keep an eye on their tamariki at all times.$body$,
  'health_safety', 'health-and-safety', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'health-and-safety' AND title = 'Unsupervised children'
);

-- ============================================================
-- Arrival guide → Emergency subpage (/arrival/emergency) — same
-- evacuation/assembly/first-aid facts, phrased for a guest already on site.
-- ============================================================

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Evacuation Exits',
  $body$• Te Puna Kai side, green gate north of Reitu Puna Kai
• Te Wharenui pathway to the waharoa of the Paa
• Ngaa Whareiti pathway to the waharoa of the Paa$body$,
  'arrival', 'arrival-emergency', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival-emergency' AND title = 'Evacuation Exits'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Assembly Point',
  $body$The assembly point is the front carpark. If the fire alarm sounds, leave by your nearest exit and gather there — don't go back inside for belongings.$body$,
  'arrival', 'arrival-emergency', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival-emergency' AND title = 'Assembly Point'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'First Aid',
  $body$The first aid kit is on the shelf in the kitchen next to the hot water, and in the mattress room. A qualified first aid person should be on site for the whole time you're hiring the Paa. In a medical emergency, call 111 for an ambulance.$body$,
  'arrival', 'arrival-emergency', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival-emergency' AND title = 'First Aid'
);

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Important',
  $body$Call 111 for an ambulance, fire, police, or to report a water, sewerage or gas leak. Appoint someone in your group as fire and safety warden for the duration of your stay — a warden vest hangs near the storeroom entrance in the kitchen. Do not re-enter any building until you've been told it's safe.$body$,
  'arrival', 'arrival-emergency', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival-emergency' AND title = 'Important'
);

-- ============================================================
-- Content library — Combi Oven scrambled eggs recipe.
-- ============================================================

INSERT INTO content_items (title, body, category, visible_to_roles, placement, block_type)
SELECT 'Combi Oven: Scrambled Eggs',
  $body$1. Turn on the Combi.
2. Preheat the Combi by pressing the preheat icon.
3. Select "Scrambled Eggs" from the menu.
4. Use the temperature probe setting, on light and soft, then close the door — it will pre-heat.
5. Prep your eggs in the tray: spray the tray with oil, then mix all the eggs into it. Use cream or butter and milk if you don't have cream.
6. When the Combi flashes to say it's ready, place the tray inside. There's a guide on the side you can pull out to rest the probe on, or use the rack. Close the door.
7. When the Combi indicates it's finished, take the tray out and use the whisk to scramble the eggs. Season with salt, cheese and parsley as needed, then serve.$body$,
  'recipe', ARRAY['member', 'caretaker', 'admin'], NULL, 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement IS NULL AND category = 'recipe' AND title = 'Combi Oven: Scrambled Eggs'
);
