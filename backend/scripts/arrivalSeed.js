// backend/scripts/arrivalSeed.js
//
// Default set of arrival items, used to seed the arrival_items table the
// first time the app starts (only runs if the table is empty). Body text
// is plain text (one paragraph/line per entry) so it can be edited via a
// simple textarea on the Edit Arrival Info page.

const items = [
  // --- Equipment & Appliances ---
  { itemKey: 'aircon', groupKey: 'equipment', title: 'Airconditioning', color: '#1976d2', sortOrder: 1, body:
`Wharenui: The remote for the air conditioning is located on the right side of the 4th pillar when looking inside from the front entrance.

Dining Room / Reitu: The remote is located on the wall. If you come in from the Reitu carving entrance it is on the left wall below the mural. If you come in from the side entrance it's on your right side.` },

  { itemKey: 'bakersOven', groupKey: 'equipment', title: 'Bakers Oven', color: '#e65100', sortOrder: 2, body:
`Ensure the Oven is turned on the wall.
Ensure the Gas Fan is turned on. The Gas Fan makes the Gas Flow.
Open the door of the oven until flat.
Locate the Gas light flap and open it.
Turn the oven on until you see the green light.
Press and turn the Dial to the Pilot light. Keep your finger on the Dial and then press the Lighter button about 10 times.
Look through the light port you will see a blue flame. It's very light but you can see it.
If it doesn't appear keep your finger on the dial and press the Lighter Button another 5 times. If it doesn't light up a blue flame keep trying until you see the flame.
When the flame is lit the oven is now active. Turn the dial to the far left to start in full ignition mode.
To turn off, turn the Dial to the far right and turn the temperature dial to off.` },

  { itemKey: 'brattPan', groupKey: 'equipment', title: 'Bratt Pan', color: '#2e7d32', sortOrder: 3, body:
`Ensure the Bratt pan is turned on the wall.
Ensure the Gas Fan is turned on. The Gas Fan makes the Gas Flow.
Press the button to fill the Bratt pan with water.
When the Bratt pan is full turn, the temperature dials up to its required temperature.` },

  { itemKey: 'chairs', groupKey: 'equipment', title: 'Chairs', color: '#c2185b', sortOrder: 4, body:
`Wharenui Chairs are stacked to the far left of the Wharenui.
Outside chairs are stacked under the awning.
Forms and stacked chairs are under the marae.
Dining Chairs are stacked on the stage, 5 high and 2 rows all the way across.` },

  { itemKey: 'chiller', groupKey: 'equipment', title: 'Chiller', color: '#00695c', sortOrder: 5, body:
`To use the Chiller, you must use the step ladder to the left of the Chiller and switch the Chiller on by looking on top of the chiller and turning on the switch.
Upon final clean ensure all food is removed.
Give the chiller a quick mop on exit and switch off from the wall.` },

  { itemKey: 'combiOvens', groupKey: 'equipment', title: 'Combi Ovens', color: '#2c3e50', sortOrder: 6, body:
`Watch this space. There will be some instructions on how to cook using the Combi ovens if you don't already know. Ensure to run a quick clean when you finish. Trays are to the right of the Combi Ovens on the bench.` },

  { itemKey: 'deepFryer', groupKey: 'equipment', title: 'Deep Fryer', color: '#2c3e50', sortOrder: 7, body:
`It takes about 20 Litres of oil to use this Fryer. To start do the same instructions as for the Bakers Oven.` },

  { itemKey: 'defibrillator', groupKey: 'equipment', title: 'Defibrillator', color: '#d32f2f', sortOrder: 8, body:
`Located to the right of the Wharenui. Please follow the instructions. Inform the Paa Committee Chairperson if it's been used.` },

  { itemKey: 'dishWasher', groupKey: 'equipment', title: 'Dish Washer', color: '#2c3e50', sortOrder: 9, body:
`Turn on the power for the dishwasher.
Then press the Power on the dishwasher.
Slide in a rack of dirty dishes and close hood.
Press Start.
Wait till finished then lift hood and remove the rack.
For the final clean ensure all of the Racks are put away below the benches and the Dishwasher hood is raised.` },

  { itemKey: 'dishes', groupKey: 'equipment', title: 'Dishes', color: '#2c3e50', sortOrder: 10, body:
`The backroom has labels for where each dish must return to.
Cutlery and Cups are on the trolley with drawers.
Ensure every dish is put away on your final clean.` },

  { itemKey: 'freezers', groupKey: 'equipment', title: 'Freezers', color: '#2c3e50', sortOrder: 11, body:
`Press the button on the top of the freezer to turn on.
Remove all kai from Freezer on final clean and turn off the Freezer.` },

  { itemKey: 'fridges', groupKey: 'equipment', title: 'Fridges', color: '#2c3e50', sortOrder: 12, body:
`Press the button on the top of the Fridges to turn on.
Remove all kai from Freezer on final clean and turn off the Fridge.` },

  { itemKey: 'gas', groupKey: 'equipment', title: 'Gas', color: '#ff6f00', sortOrder: 13, body:
`There are 2 areas where our gas bottles are located. 1 is at the back of the kitchen and the other is at the back of the new toilets.
If the gas runs out, turn the dial to the other gas bottle and open up the value. Close the Value of the gas bottle that has run out.
Important: In the kitchen, you must switch the Gas switch on (located below the power buttons for the Combi Ovens). This controls the flow of Gas. Without it switched on your gas cookers will not work and no Hot water will come out of the taps.
When not in use turn off the Gas switch.` },

  { itemKey: 'grillTops', groupKey: 'equipment', title: 'Grill Tops', color: '#2c3e50', sortOrder: 14, body:
`Switch on the Gas Switch.
Turn on the Gas dial and light with the Gas Lighter located on the shelf above the GrilTops.` },

  { itemKey: 'hangiCookers', groupKey: 'equipment', title: 'Hangi Cookers', color: '#2c3e50', sortOrder: 15, body:
`Hangi Cookers should have a connection directly to the wall gas outlet.` },

  { itemKey: 'hotBoxes', groupKey: 'equipment', title: 'Hot Boxes', color: '#2c3e50', sortOrder: 16, body:
`Hot boxes used to keep your bulk kai warm.
Just turn on and turn off as needed.
Make sure on your final clean to give it a wipe out and switch off.` },

  { itemKey: 'hotWater', groupKey: 'equipment', title: 'Hot Water', color: '#2c3e50', sortOrder: 17, body:
`For immediate hot water use the Urn on the Wall.
There maybe in some cases a plug in Urn available to you.
Hot water from the taps you must make sure you turn the Gas Switch on.` },

  { itemKey: 'microwave', groupKey: 'equipment', title: 'Microwave', color: '#2c3e50', sortOrder: 18, body:
`Make sure everything is removed and switch off when not in use.` },

  // --- Cleaning Instructions ---
  { itemKey: 'cleanDining', groupKey: 'cleaning', title: 'Clean – Final Dining Hall', color: '#d84315', sortOrder: 1, body:
`Close all windows.
Close Curtains.
Ensure all chairs are stacked away. 5 chairs high, 2 rows across the stage.
The 2 Table Trolleys and 1 Chair Trolley positioned in front of the stage.
Sweep the floors with the brush and dustpan.
Close all doors. Don't allow anyone to go on the floors.
From the Loading Dock there are 2 Green Mop Buckets and 2 Mops. Use these only for the Dining Hall. The cleaning products are to the left of the hot water Urn. If you want to get hot water out of the taps you must make sure the Gas Button is turned on. This allows the Gas to flow and heat the water.
Mop the Floor as usual.
When finished poor the water outside down the drain. Ring out the Mops and hang back up on the wall of the Loading Dock.` },

  { itemKey: 'cleanKitchen', groupKey: 'cleaning', title: 'Clean – Final Kitchen', color: '#1b5e20', sortOrder: 2, body:
`The Kitchen should be the final thing you do before exiting.
Close all windows.
Ensure all rubbish is removed. You're responsible for removing your rubbish unless prior approval with the Paa Committee Chairperson as there is an extra cost.
All Trolleys are put away in the backroom with the dishes.
All Food is removed.
All Fridges are emptied and turned off.
All Bins are cleaned and stacked to the right side of the Exit door inside.
Dishes have been put away.
Tea towels have been placed in the Washing machine and turned on.
Combi ovens have been put on clean mode.
All Stainless-steel benches are wiped down.
Dishwasher unit is emptied and racks put away.
Ensure you're the last to exit the kitchen. Don't allow anyone to go on the floors.
Urn. If you want to get hot water out of the taps you must make sure the Gas Button is turned on. This allows the Gas to flow and heat the water. Turn off when you have the hot water.
Mop the Floor ensuring you cover the entire floor. Make a track so that you'll mop all the way out to the exit door. Close the Door and lock up.
When finished pour the water outside down the drain. Ring out the Mops and hang back up on the wall of the Loading Dock.` },

  { itemKey: 'cleanToilets', groupKey: 'cleaning', title: 'Clean – Final Toilets', color: '#004d40', sortOrder: 3, body:
`Place all of the rubbish in the toilets to the outside bin. It's the responsibility of the hirer to get rid of the rubbish unless prior approval as there is an extra cost.
The Cleaning products are in the ladies toilets.
Use the paper towels and the Spray bottle labelled Bench tops to wipe down the benches.
Use the paper towels and the Spray bottle for the toilets.
Ensure all of the Lids and under the lids of the toilets are set up after cleaning.
Use the Window Cleaner to clean any dirty windows.
The Blue Mop buckets and Blue Mops are on the wall in the corner of the Dining Hall. If you come out of the toilets and head left and left again you can look on the wall to the right, and you'll see them.
Use the Floor cleaning product. Turn on a shower and use the hot water from there. Mop the showers and the floors.
Return the Mop and Buckets to original spots please.
Lock the Toilet doors so no one can use them.` },

  { itemKey: 'cleanWharenui', groupKey: 'cleaning', title: 'Clean – Final Wharenui', color: '#1565c0', sortOrder: 4, body:
`Chairs to be stacked on the far left of the wharenui by the entrance of the ariki room.
All Rubbish must be removed.
Floors to be vacuum.
Ensure to vacuum the mattress room and return the Vacuum to the Mattress room.
If windows are dirty, please use the window cleaner in the toilets and paper towels to clean.` },

  { itemKey: 'cleanEquipment', groupKey: 'cleaning', title: 'Cleaning Equipment', color: '#2c3e50', sortOrder: 5, body:
`Wharenui – Vacuum, Brushes and Brooms are in the Mattress Room.
Toilets – Cleaning chemicals are in the ladies toilet. Brooms are next to the disability toilets. Mops and Buckets are on the back wall of the Wharekai Reitu.
Kitchen – All cleaning chemicals are on the bench next to the Urn. All mops, buckets and brooms are on the back loading dock.` },

  // --- Facilities & General Information ---
  { itemKey: 'evacuation', groupKey: 'facilities', title: 'Evacuation Point', color: '#d32f2f', sortOrder: 1, body:
`The Evacuation point is located in the front car park by the main road.` },

  { itemKey: 'firstAid', groupKey: 'facilities', title: 'First Aid', color: '#2c3e50', sortOrder: 2, body:
`The 1st Aid kit is located at the shelf next to the Urn.` },

  { itemKey: 'flag', groupKey: 'facilities', title: 'Flag / Kara', color: '#2c3e50', sortOrder: 3, body:
`The Flag / Kara will stay up during the whole duration of the hui/tangi/wananga.` },

  { itemKey: 'floors', groupKey: 'facilities', title: 'Floors', color: '#2c3e50', sortOrder: 4, body:
`Every floor has a different Mop and Bucket.
The Green mop and bucket are for the Dining hall only. Use the floor cleaner.
The Yellow mop and bucket are for the Kitchen only. Do spot cleans during your time and use the Yellow mop and bucket for your final exit clean. If not, the floor will come up dirty unless its dried. Also use the sjax or Jiff products for this floor.
The Blue mop and bucket are for the new and old toilets. Floor cleaner in Ladies Toilet.` },

  { itemKey: 'linen', groupKey: 'facilities', title: 'Linen', color: '#2c3e50', sortOrder: 5, body:
`All linen is in the Mattress Room Cupboard.
On exit day, use the Green Laundry bag that is located in the Cupboard to the left of the linen cupboard and fill up with all of the linen to be collected. Leave the bags in the Mattress Room for collection.` },

  { itemKey: 'loadingDock', groupKey: 'facilities', title: 'Loading Dock', color: '#2c3e50', sortOrder: 6, body:
`Do not use the Dining Room chairs outside. It ruins the chair foot rubbers.
No smoking on the Loading Dock.
On the final clean, use the hose on the wall to hose down.` },

  { itemKey: 'mattressRoom', groupKey: 'facilities', title: 'Mattress Room', color: '#2c3e50', sortOrder: 7, body:
`In the mattress room there is a picture on the left as you walk into the mattress room of how you should leave this space. Please ensure its left in this manner.
Under no circumstances is there to be any sleeping in the mattress room. It's a fire exit and must be clear at all times.
The fire exit door should not be used unless for emergencies. There is a photo to the left as you enter the Mattress room that shows how you should leave the Mattress Room when finished.
Pillows are on the walls.
The Topper/Mattress Wall and mattress are in the middle of the room.
Whaariki are to the back wall.
6 treacle tables are stored to the back.
Vacuum is stacked at the back wall.
Blow up mattresses stack in the gap next to it.` },

  { itemKey: 'lights', groupKey: 'facilities', title: 'Lights', color: '#2c3e50', sortOrder: 8, body:
`Wharenui: The light switch for the internal lights is located to the left of the entrance door.

Wharenui mahau lights (for nighttime): Turn on at nighttime only. Use the main key that opens the toilets and wharenui and open the Ariki room which is the 1st door to the left as you enter the wharenui. Look on the wall and you'll see a Dial. Turn the Dial to On. The lights will turn on around the mahau. Exit the Ariki room and make sure it is locked. In the morning ensure to turn off these lights.

Mattress Room: The light switch is on the right side as you enter the Mattress room or the back wall by the Fire Alarm.

Toilets: These switch on automatically when a person enters the toilet. They will turn off after a period of time.

Dining Room: Light switch is located in the kitchen to the left of the storage/dishes room between the Main Switch Board and the door.

Outside and Front Gate Lights: Light switch is located in the kitchen to the left of the storage/dishes room between the Main Switch Board and the door.` },

  { itemKey: 'parking', groupKey: 'facilities', title: 'Parking', color: '#2c3e50', sortOrder: 9, body:
`3 Areas to park.
Front Carpark at the Front of the Paa.
Back Carpark behind the Wharenui and Kitchen.
On the road.` },

  { itemKey: 'pigBins', groupKey: 'facilities', title: 'Pig Bins', color: '#2c3e50', sortOrder: 10, body:
`There are large Blue pig bins at the back loading dock. Please ensure you only have food scraps in the bin. We will use these scraps in our new composting system.
Place the Bins to the left of the Loading Dock.` },

  { itemKey: 'recyclingBins', groupKey: 'facilities', title: 'Recycling Bins', color: '#2c3e50', sortOrder: 11, body:
`There is a limited amount of recycling bins. Please fill these bins and then place any extra in rubbish bags.` },

  { itemKey: 'rubbish', groupKey: 'facilities', title: 'Rubbish', color: '#2c3e50', sortOrder: 12, body:
`It is the responsibility of the hirer to remove the rubbish from the paa. However, if you require us to remove the rubbish there is a cost. For some people do hire a skip to get rid of the rubbish. We can provide you details for this.
Stack all of the rubbish bags on the grey rack on the loading dock.
We do have pig bins which you can use for kai which we use in our composting system.` },

  { itemKey: 'showers', groupKey: 'facilities', title: 'Showers', color: '#2c3e50', sortOrder: 13, body:
`The Showers use gas which is located at the back of the main toilets. If the Water goes cold, check the Dial which way it's pointing and point it to the opposite side. Then turn on the gas bottle you've pointed the dial to and you should have hot water. Any issues please call The Paa Committee Chairperson 0212749600.` },

  { itemKey: 'smoking', groupKey: 'facilities', title: 'Smoking', color: '#2c3e50', sortOrder: 14, body:
`Smoking is only permitted by the back Green toilets to the back of the loading dock.` },

  { itemKey: 'tables', groupKey: 'facilities', title: 'Tables', color: '#2c3e50', sortOrder: 15, body:
`Wharenui tables must stay in the Wharenui. No Dining room tables to be used in the Wharenui.
Wharekai tables are stacked on the trolleys and placed in front of the stage.` },

  { itemKey: 'toilets', groupKey: 'facilities', title: 'Toilets', color: '#2c3e50', sortOrder: 16, body:
`There are 3 sets of toilets that can be used during larger events.
The main toilets are to the left of the Wharenui.
There are green toilets at the back of the loading dock. These toilets will only be opened for large events. This area is also used for Smoking and Vaping.
The final is the front toilets. Due to be completed in November 2025 these will be used mainly for our visitors who come onto the Paa.` },

  { itemKey: 'trolleys', groupKey: 'facilities', title: 'Trolleys', color: '#2c3e50', sortOrder: 17, body:
`All of the kitchen trolleys must be removed from the kitchen floor and placed in the area where the dishes are stacked on final clean.
Ensure these are wiped down and clear of any kai or rubbish.` },

  { itemKey: 'vacuum', groupKey: 'facilities', title: 'Vacuum', color: '#2c3e50', sortOrder: 18, body:
`The Vacuum is located in the Mattress room of the wharenui. Please use this to do a final clean before exiting the Wharenui.
It's a backpack style so easy to use.
Please ensure the Vacuum is returned to its proper place.` },

  { itemKey: 'wifi', groupKey: 'facilities', title: 'WiFi', color: '#2c3e50', sortOrder: 19, body:
`The WiFi Router is located in the Kitchen on the shelf.
WiFi password is "NgaaTaieRua23"
Reception doesn't extend to the Wharenui.` },
];

module.exports = items;
