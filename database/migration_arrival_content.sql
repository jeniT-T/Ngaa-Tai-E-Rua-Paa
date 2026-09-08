-- database/migration_arrival_content.sql

INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Marae Facilities & Operations Guide',
  $body$Please follow these guidelines to ensure proper use of all marae facilities. Click on any section to expand.$body$,
  'general', 'arrival', 'heading'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND block_type = 'heading'
);

-- aircon
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Airconditioning',
  $body$Wharenui
The remote for the air conditioning is located on the right side of the 4th pillar when looking inside from the front entrance.

Dining Room / Reitu
The remote is located on the wall. If you come in from the Reitu carving entrance it is on the left wall below the mural. If you come in from the side entrance it's on your right side.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Airconditioning'
);

-- bakersOven
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Bakers Oven',
  $body$• Ensure the Oven is turned on the wall.
• Ensure the Gas Fan is turned on. The Gas Fan makes the Gas Flow.
• Open the door of the oven until flat.
• Locate the Gas light flap and open it.
• Turn the oven on until you see the green light.
• Press and turn the Dial to the Pilot light. Keep your finger on the Dial and then press the Lighter button about 10 times.
• Look through the light port you will see a blue flame. It's very light but you can see it.
• If it doesn't appear keep your finger on the dial and press the Lighter Button another 5 times. If it doesn't light up a blue flame keep trying until you see the flame.
• When the flame is lit the oven is now active. Turn the dial to the far left to start in full ignition mode.
• To turn off, turn the Dial to the far right and turn the temperature dial to off.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Bakers Oven'
);

-- brattPan
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Bratt Pan',
  $body$• Ensure the Bratt pan is turned on the wall.
• Ensure the Gas Fan is turned on. The Gas Fan makes the Gas Flow.
• Press the button to fill the Bratt pan with water.
• When the Bratt pan is full turn, the temperature dials up to its required temperature.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Bratt Pan'
);

-- chairs
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Chairs',
  $body$• Wharenui Chairs are stacked to the far left of the Wharenui.
• Outside chairs are stacked under the awning.
• Forms and stacked chairs are under the marae.
• Dining Chairs are stacked on the stage, 5 high and 2 rows all the way across.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Chairs'
);

-- chiller
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Chiller',
  $body$• To use the Chiller, you must use the step ladder to the left of the Chiller and switch the Chiller on by looking on top of the chiller and turning on the switch.
• Upon final clean ensure all food is removed.
• Give the chiller a quick mop on exit and switch off from the wall.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Chiller'
);

-- combiOvens
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Combi Ovens',
  $body$• Watch this space. There will be some instructions on how to cook using the Combi ovens if you don't already know. Ensure to run a quick clean when you finish. Trays are to the right of the Combi Ovens on the bench.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Combi Ovens'
);

-- deepFryer
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Deep Fryer',
  $body$• It takes about 20 Litres of oil to use this, Fryer. To start do the same instructions as for the Bakers Oven.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Deep Fryer'
);

-- defibrillator
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Defibrillator',
  $body$• Located to the right of the Wharenui. Please follow the instructions. Inform the Paa Committee Chairperson if it's been used.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Defibrillator'
);

-- cleanDining
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Clean – Final Dining Hall',
  $body$• Close all windows.
• Close Curtains.
• Ensure all chairs are stacked away. 5 chairs high, 2 rows across the stage
• The 2 Table Trolleys and 1 Chair Trolley positioned in front of the stage.
• Sweep the floors with the brush and dustpan.
• Close all doors. Don't allow anyone to go on the floors.
• From the Loading Dock there are 2 Green Mop Buckets and 2 Mops. Use these only for the Dining Hall. The cleaning products are to the left of the hot water Urn. If you want to get hot water out of the taps you must make sure the Gas Button is turned on. This allows the Gas to flow and heat the water.
• Mop the Floor as usual.
• When finished poor the water outside down the drain. Ring out the Mops and hang back up on the wall of the Loading Dock.$body$,
  'cleaning', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Clean – Final Dining Hall'
);

-- cleanKitchen
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Clean – Final Kitchen',
  $body$• The Kitchen should be the final thing you do before exiting.
• Close all windows.
• Ensure all rubbish is removed. You're responsible for removing your rubbish unless prior approval with the Paa Committee Chairperson as there is an extra cost.
• All Trolleys are put away in the backroom with the dishes.
• All Food is removed.
• All Fridges are emptied and turned off.
• All Bins are cleaned and stacked to the right side of the Exit door inside.
• Dishes have been put away.
• Tea towels have been placed in the Washing machine and turned on.
• Combi ovens have been put on clean mode.
• All Stainless-steel benches are wiped down.
• Dishwasher unit is emptied and racks put away.
• Ensure you're the last to exit the kitchen. Don't allow anyone to go on the floors.
• Urn. If you want to get hot water out of the taps you must make sure the Gas Button is turned on. This allows the Gas to flow and heat the water. Turn off when you have the hot water.
• Mop the Floor ensuring you cover the entire floor. Make a track so that you'll mop all the way out to the exit door. Close the Door and lock up.
• When finished pour the water outside down the drain. Ring out the Mops and hang back up on the wall of the Loading Dock.$body$,
  'cleaning', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Clean – Final Kitchen'
);

-- cleanToilets
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Clean – Final Toilets',
  $body$• Place all of the rubbish in the toilets to the outside bin. It's the responsibility of the hirer to get rid of the rubbish unless prior approval as there is an extra cost.
• The Cleaning products are in the ladies toilets.
• Use the paper towels and the Spray bottle labelled Bench tops to wipe down the benches.
• Use the paper towels and the Spray bottle for the toilets.
• Ensure all of the Lids and under the lids of the toilets are set up after cleaning.
• Use the Window Cleaner to clean any dirty windows.
• The Blue Mop buckets and Blue Mops are on the wall in the corner of the Dining Hall. If you come out of the toilets and head left and left again you can look on the wall to the right, and you'll see them.
• Use the Floor cleaning product. Turn on a shower and use the hot water from there. Mop the showers and the floors.
• Return the Mop and Buckets to original spots please.
• Lock the Toilet doors so no one can use them.$body$,
  'cleaning', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Clean – Final Toilets'
);

-- cleanWharenui
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Clean – Final Wharenui',
  $body$• Chairs to be stacked on the far left of the wharenui by the entrance of the ariki room.
• All Rubbish must be removed.
• Floors to be vacuum.
• Ensure to vacuum the mattress room and return the Vacuum to the Mattress room.
• If windows are dirty, please use the window cleaner in the toilets and paper towels to clean.$body$,
  'cleaning', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Clean – Final Wharenui'
);

-- cleanEquipment
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Cleaning Equipment',
  $body$• Wharenui – Vacuum, Brushes and Brooms are in the Mattress Room.
• Toilets – Cleaning chemicals are in the ladies toilet. Brooms are next to the disability toilets. Mops and Buckets are on the back wall of the Wharekai Reitu.
• Kitchen – All cleaning chemicals are on the bench next to the Urn. All mops, buckets and brooms are on the back loading dock.$body$,
  'cleaning', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Cleaning Equipment'
);

-- dishWasher
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Dish Washer',
  $body$• Turn on the power for the dishwasher.
• Then press the Power on the dishwasher.
• Slide in a rack of dirty dishes and close hood.
• Press Start.
• Wait till finished then lift hood and remove the rack.
• For the final clean ensure all of the Racks are put away below the benches and the Dishwasher hood is raised.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Dish Washer'
);

-- dishes
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Dishes',
  $body$• The backroom has labels for where each dish must return to.
• Cutlery and Cups are on the trolley with drawers.
• Ensure every dish is put away on your final clean.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Dishes'
);

-- freezers
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Freezers',
  $body$• Press the button on the top of the freezer to turn on.
• Remove all kai from Freezer on final clean and turn off the Freezer.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Freezers'
);

-- fridges
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Fridges',
  $body$• Press the button on the top of the Fridges to turn on.
• Remove all kai from Freezer on final clean and turn off the Fridge.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Fridges'
);

-- gas
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Gas',
  $body$• There are 2 areas where our gas bottles are located. 1 is at the back of the kitchen and the other is at the back of the new toilets.
• If the gas runs out, turn the dial to the other gas bottle and open up the value. Close the Value of the gas bottle that has run out.
• Important: In the kitchen, you must switch the Gas switch on (located below the power buttons for the Combi Ovens). This controls the flow of Gas. Without it switched on your gas cookers will not work and no Hot water will come out of the taps.
• When not in use turn off the Gas switch.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Gas'
);

-- grillTops
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Grill Tops',
  $body$• Switch on the Gas Switch.
• Turn on the Gas dial and light with the Gas Lighter located on the shelf above the GrilTops.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Grill Tops'
);

-- hangiCookers
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Hangi Cookers',
  $body$• Hangi Cookers should have a connection directly to the wall gas outlet.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Hangi Cookers'
);

-- hotBoxes
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Hot Boxes',
  $body$• Hot boxes used to keep your bulk kai warm.
• Just turn on and turn off as needed.
• Make sure on your final clean to give it a wipe out and switch off.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Hot Boxes'
);

-- hotWater
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Hot Water',
  $body$• For immediate hot water use the Urn on the Wall.
• There maybe in some cases a plug in Urn available to you.
• Hot water from the taps you must make sure you turn the Gas Switch 1*.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Hot Water'
);

-- microwave
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Microwave',
  $body$• Make sure everything is removed and switch off when not in use.$body$,
  'equipment', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Microwave'
);

-- evacuation
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Evacuation Point',
  $body$• The Evacuation point is located in the front car park by the main road.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Evacuation Point'
);

-- firstAid
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'First Aid',
  $body$• The 1st Aid kit is located at the shelf next to the Urn.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'First Aid'
);

-- flag
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Flag / Kara',
  $body$• The Flag / Kara will stay up during the whole duration of the hui/tangi/wananga.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Flag / Kara'
);

-- floors
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Floors',
  $body$• Every floor has a different Mop and Bucket.
• The Green mop and bucket are for the Dining hall only. Use the floor cleaner.
• The Yellow mop and bucket are for the Kitchen only. Do spot cleans during your time and use the Yellow mop and bucket for your final exit clean. If not, the floor will come up dirty unless its dried. Also use the sjax or Jiff products for this floor.
• The Blue mop and bucket are for the new and old toilets. Floor cleaner in Ladies Toilet.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Floors'
);

-- linen
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Linen',
  $body$• All linen is in the Mattress Room Cupboard.
• On exit day, use the Green Laundry bag that is located in the Cupboard to the left of the linen cupboard and fill up with all of the linen to be collected. Leave the bags in the Mattress Room for collection.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Linen'
);

-- loadingDock
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Loading Dock',
  $body$• Do not use the Dining Room chairs outside. It ruins the chair foot rubbers.
• No smoking on the Loading Dock.
• On the final clean, use the hose on the wall to hose down.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Loading Dock'
);

-- mattressRoom
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Mattress Room',
  $body$• In the mattress room there is a picture on the left as you walk into the mattress room of how you should leave this space. Please ensure its left in this manner.
• Under no circumstances is there to be any sleeping in the mattress room. It's a fire exit and must be clear at all times.
• The fire exit door should not be used unless for emergencies. There is a photo to the left as you enter the Mattress room that shows how you should leave the Mattress Room when finished.
• Pillows are on the walls.
• The Topper/Mattress Wall and mattress are in the middle of the room.
• Whaariki are to the back wall.
• 6 treacle tables are stored to the back.
• Vacuum is stacked at the back wall.
• Blow up mattresses stack in the gap next to it.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Mattress Room'
);

-- lights
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Lights',
  $body$Wharenui
The light switch for the internal lights is located to the left of the entrance door.

Wharenui mahau lights (for nighttime)
• Turn on at nighttime only.
• Use the main key that opens the toilets and wharenui and open the Ariki room which is the 1st door to the left as you enter the wharenui.
• Look on the wall and you'll see a Dial. Turn the Dial to On. The lights will turn on around the mahau.
• Exit the Ariki room and make sure it is locked.
• In the morning ensure to turn off these lights.

Mattress Room
The light switch is on the right side as you enter the Mattress room or the back wall by the Fire Alarm.

Toilets
These switch on automatically when a person enters the toilet. They will turn off after a period of time.

Dining Room
Light switch is located in the kitchen to the left of the storage/dishes room between the Main Switch Board and the door.

Outside and Front Gate Lights
Light switch is located in the kitchen to the left of the storage/dishes room between the Main Switch Board and the door.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Lights'
);

-- parking
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Parking',
  $body$• 3 Areas to park.
• Front Carpark at the Front of the Paa.
• Back Carpark behind the Wharenui and Kitchen.
• On the road.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Parking'
);

-- pigBins
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Pig Bins',
  $body$• There are large Blue pig bins at the back loading dock. Please ensure you only have food scraps in the bin. We will use these scraps in our new composting system.
• Place the Bins to the left of the Loading Dock.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Pig Bins'
);

-- recyclingBins
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Recycling Bins',
  $body$• There is a limited amount of recycling bins. Please fill these bins and then place any extra in rubbish bags.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Recycling Bins'
);

-- rubbish
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Rubbish',
  $body$• It is the responsibility of the hirer to remove the rubbish from the paa. However, if you require us to remove the rubbish there is a cost. For some people do hire a skip to get rid of the rubbish. We can provide you details for this.
• Stack all of the rubbish bags on the grey rack on the loading dock.
• We do have pig bins which you can use for kai which we use in our composting system.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Rubbish'
);

-- showers
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Showers',
  $body$• The Showers use gas which is located at the back of the main toilets. If the Water goes cold, check the Dial which way it's pointing and point it to the opposite side. Then turn on the gas bottle you've pointed the dial to and you should have hot water. Any issues please call The Paa Committee Chairperson 0212749600.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Showers'
);

-- smoking
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Smoking',
  $body$• Smoking is only permitted by the back Green toilets to the back of the loading dock.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Smoking'
);

-- tables
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Tables',
  $body$• Wharenui tables must stay in the Wharenui. No Dining room tables to be used in the Wharenui.
• Wharekai tables are stacked on the trolleys and placed in front of the stage.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Tables'
);

-- toilets
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Toilets',
  $body$• There are 3 sets of toilets that can be used during larger events.
• The main toilets are to the left of the Wharenui.
• There are green toilets at the back of the loading dock. These toilets will only be opened for large events. This area is also used for Smoking and Vaping.
• The final is the front toilets. Due to be completed in November 2025 these will be used mainly for our visitors who come onto the Paa.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Toilets'
);

-- trolleys
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Trolleys',
  $body$• All of the kitchen trolleys must be removed from the kitchen floor and placed in the area where the dishes are stacked on final clean.
• Ensure these are wiped down and clear of any kai or rubbish.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Trolleys'
);

-- vacuum
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'Vacuum',
  $body$• The Vacuum is located in the Mattress room of the wharenui. Please use this to do a final clean before exiting the Wharenui.
• It's a backpack style so easy to use.
• Please ensure the Vacuum is returned to its proper place.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'Vacuum'
);

-- wifi
INSERT INTO content_items (title, body, category, placement, block_type)
SELECT 'WiFi',
  $body$• The WiFi Router is located in the Kitchen on the shelf.
• WiFi password is "NgaaTaieRua23"
• Reception doesn't extend to the Wharenui.$body$,
  'facilities', 'arrival', 'section'
WHERE NOT EXISTS (
  SELECT 1 FROM content_items WHERE placement = 'arrival' AND title = 'WiFi'
);
