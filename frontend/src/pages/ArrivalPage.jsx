import { useState, useMemo, useEffect } from "react";
import usePageContent from "../hooks/usePageContent.js";

// --- Fallback content -------------------------------------------------
// Used only until the admin's arrival-guide content has been migrated into
// the CMS (see database/migration_arrival_content.sql), or if the content
// service is unreachable. Once the CMS has items placed on "arrival", those
// are used instead — and are fully editable/addable from the admin Content
// Manager, same as every other public page.
const FALLBACK_SECTION_CONTENT = {
  aircon: {
    title: "Airconditioning",
    color: "#1976d2",
    body: "remote air conditioning wharenui dining room",
    content: () => (
      <>
        <h3 style={{ color: "#1565c0", marginTop: 0, marginBottom: "12px", fontSize: "1rem" }}>Wharenui</h3>
        <p style={{ color: "#555", lineHeight: 1.7, margin: 0, marginBottom: "16px" }}>The remote for the air conditioning is located on the right side of the 4<sup>th</sup> pillar when looking inside from the front entrance.</p>
        <h3 style={{ color: "#1565c0", marginTop: "16px", marginBottom: "12px", fontSize: "1rem" }}>Dining Room / Reitu</h3>
        <p style={{ color: "#555", lineHeight: 1.7, margin: 0 }}>The remote is located on the wall. If you come in from the Reitu carving entrance it is on the left wall below the mural. If you come in from the side entrance it's on your right side.</p>
      </>
    ),
  },
  bakersOven: {
    title: "Bakers Oven",
    color: "#e65100",
    body: "oven gas fan dial lighter flame temperature",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Ensure the Oven is turned on the wall.</li>
        <li>Ensure the Gas Fan is turned on. The Gas Fan makes the Gas Flow.</li>
        <li>Open the door of the oven until flat.</li>
        <li>Locate the Gas light flap and open it.</li>
        <li>Turn the oven on until you see the green light.</li>
        <li>Press and turn the Dial to the Pilot light. Keep your finger on the Dial and then press the Lighter button about 10 times.</li>
        <li>Look through the light port you will see a blue flame. It's very light but you can see it.</li>
        <li>If it doesn't appear keep your finger on the dial and press the Lighter Button another 5 times. If it doesn't light up a blue flame keep trying until you see the flame.</li>
        <li>When the flame is lit the oven is now active. Turn the dial to the far left to start in full ignition mode.</li>
        <li>To turn off, turn the Dial to the far right and turn the temperature dial to off.</li>
      </ul>
    ),
  },
  brattPan: {
    title: "Bratt Pan",
    color: "#2e7d32",
    body: "bratt pan turned water temperature dials",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Ensure the Bratt pan is turned on the wall.</li>
        <li>Ensure the Gas Fan is turned on. The Gas Fan makes the Gas Flow.</li>
        <li>Press the button to fill the Bratt pan with water.</li>
        <li>When the Bratt pan is full turn, the temperature dials up to its required temperature.</li>
      </ul>
    ),
  },
  chairs: {
    title: "Chairs",
    color: "#c2185b",
    body: "chairs wharenui stacked dining stage awning",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li><strong>Wharenui Chairs</strong> are stacked to the far left of the Wharenui.</li>
        <li><strong>Outside chairs</strong> are stacked under the awning.</li>
        <li><strong>Forms and stacked chairs</strong> are under the marae.</li>
        <li><strong>Dining Chairs</strong> are stacked on the stage, 5 high and 2 rows all the way across.</li>
      </ul>
    ),
  },
  chiller: {
    title: "Chiller",
    color: "#00695c",
    body: "chiller ladder switch food clean mop",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>To use the Chiller, you must use the step ladder to the left of the Chiller and switch the Chiller on by looking on top of the chiller and turning on the switch.</li>
        <li>Upon final clean ensure all food is removed.</li>
        <li>Give the chiller a quick mop on exit and switch off from the wall.</li>
      </ul>
    ),
  },
  combiOvens: {
    title: "Combi Ovens",
    color: "#2c3e50",
    body: "combi oven cook trays clean",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Watch this space. There will be some instructions on how to cook using the Combi ovens if you don't already know. Ensure to run a quick clean when you finish. Trays are to the right of the Combi Ovens on the bench.</li>
      </ul>
    ),
  },
  deepFryer: {
    title: "Deep Fryer",
    color: "#2c3e50",
    body: "deep fryer oil instructions",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>It takes about 20 Litres of oil to use this, Fryer. To start do the same instructions as for the Bakers Oven.</li>
      </ul>
    ),
  },
  defibrillator: {
    title: "Defibrillator",
    color: "#d32f2f",
    body: "defibrillator wharenui emergency",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Located to the right of the Wharenui. Please follow the instructions. Inform the Paa Committee Chairperson if it's been used.</li>
      </ul>
    ),
  },
  cleanDining: {
    title: "Clean – Final Dining Hall",
    color: "#d84315",
    body: "dining hall clean windows curtains chairs trolleys sweep mop",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Close all windows.</li>
        <li>Close Curtains.</li>
        <li>Ensure all chairs are stacked away. 5 chairs high, 2 rows across the stage</li>
        <li>The 2 Table Trolleys and 1 Chair Trolley positioned in front of the stage.</li>
        <li>Sweep the floors with the brush and dustpan.</li>
        <li>Close all doors. Don't allow anyone to go on the floors.</li>
        <li>From the Loading Dock there are 2 Green Mop Buckets and 2 Mops. Use these only for the Dining Hall. The cleaning products are to the left of the hot water Urn. If you want to get hot water out of the taps you must make sure the Gas Button is turned on. This allows the Gas to flow and heat the water.</li>
        <li>Mop the Floor as usual.</li>
        <li>When finished poor the water outside down the drain. Ring out the Mops and hang back up on the wall of the Loading Dock.</li>
      </ul>
    ),
  },
  cleanKitchen: {
    title: "Clean – Final Kitchen",
    color: "#1b5e20",
    body: "kitchen clean rubbish fridges dishes combi ovens benches dishwasher mop",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>The Kitchen should be the final thing you do before exiting.</li>
        <li>Close all windows.</li>
        <li>Ensure all rubbish is removed. You're responsible for removing your rubbish unless prior approval with the Paa Committee Chairperson as there is an extra cost.</li>
        <li>All Trolleys are put away in the backroom with the dishes.</li>
        <li>All Food is removed.</li>
        <li>All Fridges are emptied and turned off.</li>
        <li>All Bins are cleaned and stacked to the right side of the Exit door inside.</li>
        <li>Dishes have been put away.</li>
        <li>Tea towels have been placed in the Washing machine and turned on.</li>
        <li>Combi ovens have been put on clean mode.</li>
        <li>All Stainless-steel benches are wiped down.</li>
        <li>Dishwasher unit is emptied and racks put away.</li>
        <li>Ensure you're the last to exit the kitchen. Don't allow anyone to go on the floors.</li>
        <li>Urn. If you want to get hot water out of the taps you must make sure the Gas Button is turned on. This allows the Gas to flow and heat the water. Turn off when you have the hot water.</li>
        <li>Mop the Floor ensuring you cover the entire floor. Make a track so that you'll mop all the way out to the exit door. Close the Door and lock up.</li>
        <li>When finished pour the water outside down the drain. Ring out the Mops and hang back up on the wall of the Loading Dock.</li>
      </ul>
    ),
  },
  cleanToilets: {
    title: "Clean – Final Toilets",
    color: "#004d40",
    body: "toilet clean rubbish products benches window cleaner mop shower",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Place all of the rubbish in the toilets to the outside bin. It's the responsibility of the hirer to get rid of the rubbish unless prior approval as there is an extra cost.</li>
        <li>The Cleaning products are in the ladies toilets.</li>
        <li>Use the paper towels and the Spray bottle labelled Bench tops to wipe down the benches.</li>
        <li>Use the paper towels and the Spray bottle for the toilets.</li>
        <li>Ensure all of the Lids and under the lids of the toilets are set up after cleaning.</li>
        <li>Use the Window Cleaner to clean any dirty windows.</li>
        <li>The Blue Mop buckets and Blue Mops are on the wall in the corner of the Dining Hall. If you come out of the toilets and head left and left again you can look on the wall to the right, and you'll see them.</li>
        <li>Use the Floor cleaning product. Turn on a shower and use the hot water from there. Mop the showers and the floors.</li>
        <li>Return the Mop and Buckets to original spots please.</li>
        <li>Lock the Toilet doors so no one can use them.</li>
      </ul>
    ),
  },
  cleanWharenui: {
    title: "Clean – Final Wharenui",
    color: "#1565c0",
    body: "wharenui clean chairs ariki room rubbish vacuum mattress windows",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Chairs to be stacked on the far left of the wharenui by the entrance of the ariki room.</li>
        <li>All Rubbish must be removed.</li>
        <li>Floors to be vacuum.</li>
        <li>Ensure to vacuum the mattress room and return the Vacuum to the Mattress room.</li>
        <li>If windows are dirty, please use the window cleaner in the toilets and paper towels to clean.</li>
      </ul>
    ),
  },
  cleanEquipment: {
    title: "Cleaning Equipment",
    color: "#2c3e50",
    body: "cleaning equipment vacuum brushes brooms chemicals mops buckets",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li><strong>Wharenui</strong> – Vacuum, Brushes and Brooms are in the Mattress Room.</li>
        <li><strong>Toilets</strong> – Cleaning chemicals are in the ladies toilet. Brooms are next to the disability toilets. Mops and Buckets are on the back wall of the Wharekai Reitu.</li>
        <li><strong>Kitchen</strong> – All cleaning chemicals are on the bench next to the Urn. All mops, buckets and brooms are on the back loading dock.</li>
      </ul>
    ),
  },
  dishWasher: {
    title: "Dish Washer",
    color: "#2c3e50",
    body: "dishwasher power dishes hood racks clean",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Turn on the power for the dishwasher.</li>
        <li>Then press the Power on the dishwasher.</li>
        <li>Slide in a rack of dirty dishes and close hood.</li>
        <li>Press Start.</li>
        <li>Wait till finished then lift hood and remove the rack.</li>
        <li>For the final clean ensure all of the Racks are put away below the benches and the Dishwasher hood is raised.</li>
      </ul>
    ),
  },
  dishes: {
    title: "Dishes",
    color: "#2c3e50",
    body: "dishes backroom labels cutlery cups trolley clean",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>The backroom has labels for where each dish must return to.</li>
        <li>Cutlery and Cups are on the trolley with drawers.</li>
        <li>Ensure every dish is put away on your final clean.</li>
      </ul>
    ),
  },
  freezers: {
    title: "Freezers",
    color: "#2c3e50",
    body: "freezer button kai remove turn off",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Press the button on the top of the freezer to turn on.</li>
        <li>Remove all kai from Freezer on final clean and turn off the Freezer.</li>
      </ul>
    ),
  },
  fridges: {
    title: "Fridges",
    color: "#2c3e50",
    body: "fridge button kai remove turn off",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Press the button on the top of the Fridges to turn on.</li>
        <li>Remove all kai from Freezer on final clean and turn off the Fridge.</li>
      </ul>
    ),
  },
  gas: {
    title: "Gas",
    color: "#ff6f00",
    body: "gas bottles dial switch kitchen combi cookers hot water",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>There are 2 areas where our gas bottles are located. 1 is at the back of the kitchen and the other is at the back of the new toilets.</li>
        <li>If the gas runs out, turn the dial to the other gas bottle and open up the value. Close the Value of the gas bottle that has run out.</li>
        <li><strong>Important:</strong> In the kitchen, you must switch the Gas switch on (located below the power buttons for the Combi Ovens). This controls the flow of Gas. Without it switched on your gas cookers will not work and no Hot water will come out of the taps.</li>
        <li>When not in use turn off the Gas switch.</li>
      </ul>
    ),
  },
  grillTops: {
    title: "Grill Tops",
    color: "#2c3e50",
    body: "grill tops gas switch dial lighter",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Switch on the Gas Switch.</li>
        <li>Turn on the Gas dial and light with the Gas Lighter located on the shelf above the GrilTops.</li>
      </ul>
    ),
  },
  hangiCookers: {
    title: "Hangi Cookers",
    color: "#2c3e50",
    body: "hangi cookers gas outlet wall",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Hangi Cookers should have a connection directly to the wall gas outlet.</li>
      </ul>
    ),
  },
  hotBoxes: {
    title: "Hot Boxes",
    color: "#2c3e50",
    body: "hot boxes kai warm turn on off wipe clean",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Hot boxes used to keep your bulk kai warm.</li>
        <li>Just turn on and turn off as needed.</li>
        <li>Make sure on your final clean to give it a wipe out and switch off.</li>
      </ul>
    ),
  },
  hotWater: {
    title: "Hot Water",
    color: "#2c3e50",
    body: "hot water urn wall taps gas switch",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>For immediate hot water use the Urn on the Wall.</li>
        <li>There maybe in some cases a plug in Urn available to you.</li>
        <li>Hot water from the taps you must make sure you turn the Gas Switch 1*.</li>
      </ul>
    ),
  },
  microwave: {
    title: "Microwave",
    color: "#2c3e50",
    body: "microwave remove turn off not in use",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Make sure everything is removed and switch off when not in use.</li>
      </ul>
    ),
  },
  evacuation: {
    title: "Evacuation Point",
    color: "#d32f2f",
    body: "evacuation point front car park main road emergency",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>The Evacuation point is located in the front car park by the main road.</li>
      </ul>
    ),
  },
  firstAid: {
    title: "First Aid",
    color: "#2c3e50",
    body: "first aid kit shelf urn emergency",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>The 1<sup>st</sup> Aid kit is located at the shelf next to the Urn.</li>
      </ul>
    ),
  },
  flag: {
    title: "Flag / Kara",
    color: "#2c3e50",
    body: "flag kara hui tangi wananga",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>The Flag / Kara will stay up during the whole duration of the hui/tangi/wananga.</li>
      </ul>
    ),
  },
  floors: {
    title: "Floors",
    color: "#2c3e50",
    body: "floors mop bucket dining kitchen toilets cleaner jiff",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Every floor has a different Mop and Bucket.</li>
        <li>The Green mop and bucket are for the Dining hall only. Use the floor cleaner.</li>
        <li>The Yellow mop and bucket are for the Kitchen only. Do spot cleans during your time and use the Yellow mop and bucket for your final exit clean. If not, the floor will come up dirty unless its dried. Also use the sjax or Jiff products for this floor.</li>
        <li>The Blue mop and bucket are for the new and old toilets. Floor cleaner in Ladies Toilet.</li>
      </ul>
    ),
  },
  linen: {
    title: "Linen",
    color: "#2c3e50",
    body: "linen mattress room cupboard laundry bag collection",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>All linen is in the Mattress Room Cupboard.</li>
        <li>On exit day, use the Green Laundry bag that is located in the Cupboard to the left of the linen cupboard and fill up with all of the linen to be collected. Leave the bags in the Mattress Room for collection.</li>
      </ul>
    ),
  },
  loadingDock: {
    title: "Loading Dock",
    color: "#2c3e50",
    body: "loading dock chairs dining room smoking hose clean",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Do not use the Dining Room chairs outside. It ruins the chair foot rubbers.</li>
        <li>No smoking on the Loading Dock.</li>
        <li>On the final clean, use the hose on the wall to hose down.</li>
      </ul>
    ),
  },
  mattressRoom: {
    title: "Mattress Room",
    color: "#2c3e50",
    body: "mattress room fire exit pillows mattress whaariki vacuum blow up",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>In the mattress room there is a picture on the left as you walk into the mattress room of how you should leave this space. Please ensure its left in this manner.</li>
        <li>Under no circumstances is there to be any sleeping in the mattress room. It's a fire exit and must be clear at all times.</li>
        <li>The fire exit door should not be used unless for emergencies. There is a photo to the left as you enter the Mattress room that shows how you should leave the Mattress Room when finished.</li>
        <li>Pillows are on the walls.</li>
        <li>The Topper/Mattress Wall and mattress are in the middle of the room.</li>
        <li>Whaariki are to the back wall.</li>
        <li>6 treacle tables are stored to the back.</li>
        <li>Vacuum is stacked at the back wall.</li>
        <li>Blow up mattresses stack in the gap next to it.</li>
      </ul>
    ),
  },
  lights: {
    title: "Lights",
    color: "#2c3e50",
    body: "lights wharenui mahau ariki room toilets dining outside",
    content: () => (
      <div>
        <h4 style={{ color: "#555", marginTop: "0px", marginBottom: "8px" }}>Wharenui</h4>
        <p style={{ color: "#555", lineHeight: 1.7, margin: "0 0 12px 0" }}>The light switch for the internal lights is located to the left of the entrance door.</p>

        <h4 style={{ color: "#555", marginTop: "12px", marginBottom: "8px" }}>Wharenui mahau lights (for nighttime)</h4>
        <ul style={{ lineHeight: 1.8, color: "#555", margin: "0 0 12px 0", paddingLeft: "20px" }}>
          <li>Turn on at nighttime only.</li>
          <li>Use the main key that opens the toilets and wharenui and open the Ariki room which is the 1<sup>st</sup> door to the left as you enter the wharenui.</li>
          <li>Look on the wall and you'll see a Dial. Turn the Dial to On. The lights will turn on around the mahau.</li>
          <li>Exit the Ariki room and make sure it is locked.</li>
          <li>In the morning ensure to turn off these lights.</li>
        </ul>

        <h4 style={{ color: "#555", marginTop: "12px", marginBottom: "8px" }}>Mattress Room</h4>
        <p style={{ color: "#555", lineHeight: 1.7, margin: "0 0 12px 0" }}>The light switch is on the right side as you enter the Mattress room or the back wall by the Fire Alarm.</p>

        <h4 style={{ color: "#555", marginTop: "12px", marginBottom: "8px" }}>Toilets</h4>
        <p style={{ color: "#555", lineHeight: 1.7, margin: "0 0 12px 0" }}>These switch on automatically when a person enters the toilet. They will turn off after a period of time.</p>

        <h4 style={{ color: "#555", marginTop: "12px", marginBottom: "8px" }}>Dining Room</h4>
        <p style={{ color: "#555", lineHeight: 1.7, margin: "0 0 12px 0" }}>Light switch is located in the kitchen to the left of the storage/dishes room between the Main Switch Board and the door.</p>

        <h4 style={{ color: "#555", marginTop: "12px", marginBottom: "8px" }}>Outside and Front Gate Lights</h4>
        <p style={{ color: "#555", lineHeight: 1.7, margin: "0" }}>Light switch is located in the kitchen to the left of the storage/dishes room between the Main Switch Board and the door.</p>
      </div>
    ),
  },
  parking: {
    title: "Parking",
    color: "#2c3e50",
    body: "parking front carpark back carpark road",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>3 Areas to park.</li>
        <li>Front Carpark at the Front of the Paa.</li>
        <li>Back Carpark behind the Wharenui and Kitchen.</li>
        <li>On the road.</li>
      </ul>
    ),
  },
  pigBins: {
    title: "Pig Bins",
    color: "#2c3e50",
    body: "pig bins blue loading dock food scraps composting",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>There are large Blue pig bins at the back loading dock. Please ensure you only have food scraps in the bin. We will use these scraps in our new composting system.</li>
        <li>Place the Bins to the left of the Loading Dock.</li>
      </ul>
    ),
  },
  recyclingBins: {
    title: "Recycling Bins",
    color: "#2c3e50",
    body: "recycling bins limited rubbish bags",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>There is a limited amount of recycling bins. Please fill these bins and then place any extra in rubbish bags.</li>
      </ul>
    ),
  },
  rubbish: {
    title: "Rubbish",
    color: "#2c3e50",
    body: "rubbish hirer remove cost skip grey rack pig bins",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>It is the responsibility of the hirer to remove the rubbish from the paa. However, if you require us to remove the rubbish there is a cost. For some people do hire a skip to get rid of the rubbish. We can provide you details for this.</li>
        <li>Stack all of the rubbish bags on the grey rack on the loading dock.</li>
        <li>We do have pig bins which you can use for kai which we use in our composting system.</li>
      </ul>
    ),
  },
  showers: {
    title: "Showers",
    color: "#2c3e50",
    body: "showers gas toilets dial hot water cold chairperson",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>The Showers use gas which is located at the back of the main toilets. If the Water goes cold, check the Dial which way it's pointing and point it to the opposite side. Then turn on the gas bottle you've pointed the dial to and you should have hot water. Any issues please call The Paa Committee Chairperson 0212749600.</li>
      </ul>
    ),
  },
  smoking: {
    title: "Smoking",
    color: "#2c3e50",
    body: "smoking permitted green toilets loading dock",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Smoking is only permitted by the back Green toilets to the back of the loading dock.</li>
      </ul>
    ),
  },
  tables: {
    title: "Tables",
    color: "#2c3e50",
    body: "tables wharenui dining room trolleys stage",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>Wharenui tables must stay in the Wharenui. No Dining room tables to be used in the Wharenui.</li>
        <li>Wharekai tables are stacked on the trolleys and placed in front of the stage.</li>
      </ul>
    ),
  },
  toilets: {
    title: "Toilets",
    color: "#2c3e50",
    body: "toilets sets events main green back front visitors",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>There are 3 sets of toilets that can be used during larger events.</li>
        <li>The main toilets are to the left of the Wharenui.</li>
        <li>There are green toilets at the back of the loading dock. These toilets will only be opened for large events. This area is also used for Smoking and Vaping.</li>
        <li>The final is the front toilets. Due to be completed in November 2025 these will be used mainly for our visitors who come onto the Paa.</li>
      </ul>
    ),
  },
  trolleys: {
    title: "Trolleys",
    color: "#2c3e50",
    body: "trolleys kitchen floor dishes stacked clean",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>All of the kitchen trolleys must be removed from the kitchen floor and placed in the area where the dishes are stacked on final clean.</li>
        <li>Ensure these are wiped down and clear of any kai or rubbish.</li>
      </ul>
    ),
  },
  vacuum: {
    title: "Vacuum",
    color: "#2c3e50",
    body: "vacuum mattress room wharenui backpack final clean",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>The Vacuum is located in the Mattress room of the wharenui. Please use this to do a final clean before exiting the Wharenui.</li>
        <li>It's a backpack style so easy to use.</li>
        <li>Please ensure the Vacuum is returned to its proper place.</li>
      </ul>
    ),
  },
  wifi: {
    title: "WiFi",
    color: "#2c3e50",
    body: "wifi router kitchen shelf password reception wharenui",
    content: () => (
      <ul style={{ lineHeight: 1.8, color: "#555", margin: 0, paddingLeft: "20px" }}>
        <li>The WiFi Router is located in the Kitchen on the shelf.</li>
        <li>WiFi password is "NgaaTaieRua23"</li>
        <li>Reception doesn't extend to the Wharenui.</li>
      </ul>
    ),
  },
};

const FALLBACK_GROUP_MEMBERS = {
  equipment: ["aircon", "bakersOven", "brattPan", "chairs", "chiller", "combiOvens", "deepFryer", "defibrillator", "dishWasher", "dishes", "freezers", "fridges", "gas", "grillTops", "hangiCookers", "hotBoxes", "hotWater", "microwave"],
  cleaning: ["cleanDining", "cleanKitchen", "cleanToilets", "cleanWharenui", "cleanEquipment"],
  facilities: ["evacuation", "firstAid", "flag", "floors", "linen", "loadingDock", "mattressRoom", "lights", "parking", "pigBins", "recyclingBins", "rubbish", "showers", "smoking", "tables", "toilets", "trolleys", "vacuum", "wifi"],
};

const GROUP_LABELS = {
  equipment: "Equipment & Appliances",
  cleaning: "Cleaning Instructions",
  facilities: "Facilities & General Information",
};
const GROUP_ORDER = ["equipment", "cleaning", "facilities"];
const GROUP_COLORS = { equipment: "#1976d2", cleaning: "#2e7d32", facilities: "#2c3e50" };

function ArrivalPage() {
  const { heading, sections } = usePageContent("arrival");
  const usingCms = sections.length > 0;

  // Build a title/body/color/content lookup, and which group each id
  // belongs to, from whichever source is active (CMS or fallback).
  const { sectionContent, groupMembers, groupOrder } = useMemo(() => {
    if (!usingCms) {
      return { sectionContent: FALLBACK_SECTION_CONTENT, groupMembers: FALLBACK_GROUP_MEMBERS, groupOrder: GROUP_ORDER };
    }

    const content = {};
    const members = {};
    const order = [];

    sections.forEach((item) => {
      const id = String(item.id);
      const group = GROUP_ORDER.includes(item.category) ? item.category : "facilities";
      content[id] = {
        title: item.title,
        color: GROUP_COLORS[group] || "#2c3e50",
        body: item.body,
        content: () => (
          <p style={{ color: "#555", lineHeight: 1.8, margin: 0, whiteSpace: "pre-line" }}>{item.body}</p>
        ),
      };
      if (!members[group]) {
        members[group] = [];
        order.push(group);
      }
      members[group].push(id);
    });

    // Keep the three known groups first, in their usual order, then any
    // extra groups an admin has invented via a new category name.
    const knownFirst = [...GROUP_ORDER.filter((g) => order.includes(g)), ...order.filter((g) => !GROUP_ORDER.includes(g))];

    return { sectionContent: content, groupMembers: members, groupOrder: knownFirst };
  }, [usingCms, sections]);

  const [expandedSections, setExpandedSections] = useState({});
  const [expandedGroupHeaders, setExpandedGroupHeaders] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleGroupHeader = (groupId) => {
    setExpandedGroupHeaders((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const filteredSections = useMemo(() => {
    const allIds = Object.keys(sectionContent);
    if (!searchTerm.trim()) return allIds;
    const term = searchTerm.toLowerCase();
    return allIds.filter((id) => {
      const section = sectionContent[id];
      return section.title.toLowerCase().includes(term) || section.body.toLowerCase().includes(term);
    });
  }, [searchTerm, sectionContent]);

  const allGroupsExpanded = () => {
    const expanded = {};
    groupOrder.forEach((g) => (expanded[g] = true));
    return expanded;
  };
  const allGroupsCollapsed = () => {
    const collapsed = {};
    groupOrder.forEach((g) => (collapsed[g] = false));
    return collapsed;
  };

  // Auto-expand group headers when searching, keep items collapsed
  useEffect(() => {
    if (searchTerm.trim()) {
      setExpandedGroupHeaders(allGroupsExpanded());
      setExpandedSections({}); // Keep individual items collapsed
    } else {
      setExpandedGroupHeaders(allGroupsCollapsed());
      setExpandedSections({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, groupOrder.join(",")]);

  const handleExpandAll = () => {
    const allExpanded = {};
    filteredSections.forEach((id) => {
      allExpanded[id] = true;
    });
    setExpandedSections(allExpanded);
    setExpandedGroupHeaders(allGroupsExpanded());
  };

  const handleCollapseAll = () => {
    setExpandedSections({});
    setExpandedGroupHeaders(allGroupsCollapsed());
  };

  const CollapsibleSection = ({ id, title, color, children }) => {
    const isExpanded = expandedSections[id];
    return (
      <section style={{ marginBottom: "16px", borderRadius: "6px", border: `1px solid ${color}20`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <button
          onClick={() => toggleSection(id)}
          style={{
            width: "100%",
            padding: "16px 20px",
            background: `${color}15`,
            borderLeft: `4px solid ${color}`,
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "1.1rem",
            fontWeight: "600",
            color: "#2c3e50",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = `${color}25`;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = `${color}15`;
          }}
        >
          <span>{title}</span>
          <span
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
              fontSize: "1.3rem",
              lineHeight: "1",
            }}
          >
            ▼
          </span>
        </button>
        {isExpanded && (
          <div style={{ padding: "20px", background: "#fff", borderTop: `1px solid ${color}20` }}>
            {children}
          </div>
        )}
      </section>
    );
  };

  const CollapsibleGroupHeader = ({ groupId, title, children }) => {
    const isExpanded = expandedGroupHeaders[groupId];
    return (
      <div style={{ marginBottom: "28px" }}>
        <button
          onClick={() => toggleGroupHeader(groupId)}
          style={{
            width: "100%",
            padding: "16px 20px",
            background: "#f5f5f5",
            border: "2px solid #d4af37",
            borderRadius: "6px",
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "1.3rem",
            fontWeight: "600",
            color: "#2c3e50",
            transition: "all 0.2s ease",
            marginBottom: "16px",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#efefef";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#f5f5f5";
          }}
        >
          <span>{title}</span>
          <span
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
              fontSize: "1.5rem",
              lineHeight: "1",
            }}
          >
            ▼
          </span>
        </button>
        {isExpanded && <div>{children}</div>}
      </div>
    );
  };

  const sectionsByGroup = {};
  groupOrder.forEach((g) => {
    sectionsByGroup[g] = filteredSections.filter((id) => (groupMembers[g] || []).includes(id));
  });

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", textAlign: "left", fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#2c3e50", borderBottom: "3px solid #d4af37", paddingBottom: "16px", marginBottom: "8px" }}>
        {heading ? heading.title : "Marae Facilities & Operations Guide"}
      </h1>
      <p style={{ fontSize: "1rem", color: "#777", marginBottom: "24px", fontStyle: "italic", whiteSpace: "pre-line" }}>
        {heading
          ? heading.body
          : "Please follow these guidelines to ensure proper use of all marae facilities. Click on any section to expand."}
      </p>

      <div style={{ marginBottom: "32px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search sections and content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: "1",
            minWidth: "250px",
            padding: "12px 16px",
            fontSize: "1rem",
            border: "2px solid #d4af37",
            borderRadius: "6px",
            fontFamily: "sans-serif",
            outline: "none",
            background: "#f5f5f5",
            color: "#2c3e50",
          }}
        />
        <button
          onClick={handleExpandAll}
          style={{
            padding: "10px 16px",
            background: "#2c3e50",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "0.95rem",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.background = "#1a252f"}
          onMouseLeave={(e) => e.target.style.background = "#2c3e50"}
        >
          Expand All
        </button>
        <button
          onClick={handleCollapseAll}
          style={{
            padding: "10px 16px",
            background: "#d4af37",
            color: "#2c3e50",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "0.95rem",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.background = "#c9a426"}
          onMouseLeave={(e) => e.target.style.background = "#d4af37"}
        >
          Collapse All
        </button>
      </div>

      {filteredSections.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#777", fontSize: "1.1rem" }}>
          No sections found matching "{searchTerm}"
        </div>
      ) : (
        <div>
          {groupOrder.map((groupId) =>
            sectionsByGroup[groupId].length > 0 ? (
              <CollapsibleGroupHeader
                key={groupId}
                groupId={groupId}
                title={GROUP_LABELS[groupId] || groupId}
              >
                {sectionsByGroup[groupId].map((id) => (
                  <CollapsibleSection key={id} id={id} title={sectionContent[id].title} color={sectionContent[id].color}>
                    {sectionContent[id].content()}
                  </CollapsibleSection>
                ))}
              </CollapsibleGroupHeader>
            ) : null
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "20px", background: "#fafafa", borderRadius: "6px", border: "1px solid #ddd", textAlign: "center" }}>
        <p style={{ color: "#555", margin: 0, fontSize: "0.95rem" }}>
          For questions or issues, please contact the Paa Committee Chairperson at 0212749600
        </p>
      </div>
    </div>
  );
}

export default ArrivalPage;
