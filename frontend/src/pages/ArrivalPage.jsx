import { useState, useMemo, useEffect } from "react";
import usePageContent from "../hooks/usePageContent.js";
import { getYoutubeEmbedUrl } from "../utils/youtube.js";

// --- Fallback content -------------------------------------------------
// Used only until the arrival guide's content has been migrated into the
// CMS (see database/migration_arrival_content.sql), or if the content
// service is unreachable. Once the CMS has items placed on "arrival",
// those are used instead — fully editable/addable from the admin Content
// Manager, same as every other page, including attaching a video.
const FALLBACK_ITEMS = [
  { id: "aircon", title: "Airconditioning", category: "equipment", body: "Wharenui\nThe remote for the air conditioning is located on the right side of the 4th pillar when looking inside from the front entrance.\n\nDining Room / Reitu\nThe remote is located on the wall. If you come in from the Reitu carving entrance it is on the left wall below the mural. If you come in from the side entrance it's on your right side." },
  { id: "bakersOven", title: "Bakers Oven", category: "equipment", body: "• Ensure the Oven is turned on the wall.\n• Ensure the Gas Fan is turned on. The Gas Fan makes the Gas Flow.\n• Open the door of the oven until flat.\n• Locate the Gas light flap and open it.\n• Turn the oven on until you see the green light.\n• Press and turn the Dial to the Pilot light. Keep your finger on the Dial and then press the Lighter button about 10 times.\n• Look through the light port you will see a blue flame. It's very light but you can see it.\n• If it doesn't appear keep your finger on the dial and press the Lighter Button another 5 times. If it doesn't light up a blue flame keep trying until you see the flame.\n• When the flame is lit the oven is now active. Turn the dial to the far left to start in full ignition mode.\n• To turn off, turn the Dial to the far right and turn the temperature dial to off." },
  { id: "brattPan", title: "Bratt Pan", category: "equipment", body: "• Ensure the Bratt pan is turned on the wall.\n• Ensure the Gas Fan is turned on. The Gas Fan makes the Gas Flow.\n• Press the button to fill the Bratt pan with water.\n• When the Bratt pan is full turn, the temperature dials up to its required temperature." },
  { id: "chairs", title: "Chairs", category: "equipment", body: "• Wharenui Chairs are stacked to the far left of the Wharenui.\n• Outside chairs are stacked under the awning.\n• Forms and stacked chairs are under the marae.\n• Dining Chairs are stacked on the stage, 5 high and 2 rows all the way across." },
  { id: "chiller", title: "Chiller", category: "equipment", body: "• To use the Chiller, you must use the step ladder to the left of the Chiller and switch the Chiller on by looking on top of the chiller and turning on the switch.\n• Upon final clean ensure all food is removed.\n• Give the chiller a quick mop on exit and switch off from the wall." },
  { id: "combiOvens", title: "Combi Ovens", category: "equipment", body: "• Watch this space. There will be some instructions on how to cook using the Combi ovens if you don't already know. Ensure to run a quick clean when you finish. Trays are to the right of the Combi Ovens on the bench." },
  { id: "deepFryer", title: "Deep Fryer", category: "equipment", body: "• It takes about 20 Litres of oil to use this, Fryer. To start do the same instructions as for the Bakers Oven." },
  { id: "defibrillator", title: "Defibrillator", category: "equipment", body: "• Located to the right of the Wharenui. Please follow the instructions. Inform the Paa Committee Chairperson if it's been used." },
  { id: "cleanDining", title: "Clean – Final Dining Hall", category: "cleaning", body: "• Close all windows.\n• Close Curtains.\n• Ensure all chairs are stacked away. 5 chairs high, 2 rows across the stage\n• The 2 Table Trolleys and 1 Chair Trolley positioned in front of the stage.\n• Sweep the floors with the brush and dustpan.\n• Close all doors. Don't allow anyone to go on the floors.\n• From the Loading Dock there are 2 Green Mop Buckets and 2 Mops. Use these only for the Dining Hall. The cleaning products are to the left of the hot water Urn. If you want to get hot water out of the taps you must make sure the Gas Button is turned on. This allows the Gas to flow and heat the water.\n• Mop the Floor as usual.\n• When finished poor the water outside down the drain. Ring out the Mops and hang back up on the wall of the Loading Dock." },
  { id: "cleanKitchen", title: "Clean – Final Kitchen", category: "cleaning", body: "• The Kitchen should be the final thing you do before exiting.\n• Close all windows.\n• Ensure all rubbish is removed. You're responsible for removing your rubbish unless prior approval with the Paa Committee Chairperson as there is an extra cost.\n• All Trolleys are put away in the backroom with the dishes.\n• All Food is removed.\n• All Fridges are emptied and turned off.\n• All Bins are cleaned and stacked to the right side of the Exit door inside.\n• Dishes have been put away.\n• Tea towels have been placed in the Washing machine and turned on.\n• Combi ovens have been put on clean mode.\n• All Stainless-steel benches are wiped down.\n• Dishwasher unit is emptied and racks put away.\n• Ensure you're the last to exit the kitchen. Don't allow anyone to go on the floors.\n• Urn. If you want to get hot water out of the taps you must make sure the Gas Button is turned on. This allows the Gas to flow and heat the water. Turn off when you have the hot water.\n• Mop the Floor ensuring you cover the entire floor. Make a track so that you'll mop all the way out to the exit door. Close the Door and lock up.\n• When finished pour the water outside down the drain. Ring out the Mops and hang back up on the wall of the Loading Dock." },
  { id: "cleanToilets", title: "Clean – Final Toilets", category: "cleaning", body: "• Place all of the rubbish in the toilets to the outside bin. It's the responsibility of the hirer to get rid of the rubbish unless prior approval as there is an extra cost.\n• The Cleaning products are in the ladies toilets.\n• Use the paper towels and the Spray bottle labelled Bench tops to wipe down the benches.\n• Use the paper towels and the Spray bottle for the toilets.\n• Ensure all of the Lids and under the lids of the toilets are set up after cleaning.\n• Use the Window Cleaner to clean any dirty windows.\n• The Blue Mop buckets and Blue Mops are on the wall in the corner of the Dining Hall. If you come out of the toilets and head left and left again you can look on the wall to the right, and you'll see them.\n• Use the Floor cleaning product. Turn on a shower and use the hot water from there. Mop the showers and the floors.\n• Return the Mop and Buckets to original spots please.\n• Lock the Toilet doors so no one can use them." },
  { id: "cleanWharenui", title: "Clean – Final Wharenui", category: "cleaning", body: "• Chairs to be stacked on the far left of the wharenui by the entrance of the ariki room.\n• All Rubbish must be removed.\n• Floors to be vacuum.\n• Ensure to vacuum the mattress room and return the Vacuum to the Mattress room.\n• If windows are dirty, please use the window cleaner in the toilets and paper towels to clean." },
  { id: "cleanEquipment", title: "Cleaning Equipment", category: "cleaning", body: "• Wharenui – Vacuum, Brushes and Brooms are in the Mattress Room.\n• Toilets – Cleaning chemicals are in the ladies toilet. Brooms are next to the disability toilets. Mops and Buckets are on the back wall of the Wharekai Reitu.\n• Kitchen – All cleaning chemicals are on the bench next to the Urn. All mops, buckets and brooms are on the back loading dock." },
  { id: "dishWasher", title: "Dish Washer", category: "equipment", body: "• Turn on the power for the dishwasher.\n• Then press the Power on the dishwasher.\n• Slide in a rack of dirty dishes and close hood.\n• Press Start.\n• Wait till finished then lift hood and remove the rack.\n• For the final clean ensure all of the Racks are put away below the benches and the Dishwasher hood is raised." },
  { id: "dishes", title: "Dishes", category: "equipment", body: "• The backroom has labels for where each dish must return to.\n• Cutlery and Cups are on the trolley with drawers.\n• Ensure every dish is put away on your final clean." },
  { id: "freezers", title: "Freezers", category: "equipment", body: "• Press the button on the top of the freezer to turn on.\n• Remove all kai from Freezer on final clean and turn off the Freezer." },
  { id: "fridges", title: "Fridges", category: "equipment", body: "• Press the button on the top of the Fridges to turn on.\n• Remove all kai from Freezer on final clean and turn off the Fridge." },
  { id: "gas", title: "Gas", category: "equipment", body: "• There are 2 areas where our gas bottles are located. 1 is at the back of the kitchen and the other is at the back of the new toilets.\n• If the gas runs out, turn the dial to the other gas bottle and open up the value. Close the Value of the gas bottle that has run out.\n• Important: In the kitchen, you must switch the Gas switch on (located below the power buttons for the Combi Ovens). This controls the flow of Gas. Without it switched on your gas cookers will not work and no Hot water will come out of the taps.\n• When not in use turn off the Gas switch." },
  { id: "grillTops", title: "Grill Tops", category: "equipment", body: "• Switch on the Gas Switch.\n• Turn on the Gas dial and light with the Gas Lighter located on the shelf above the GrilTops." },
  { id: "hangiCookers", title: "Hangi Cookers", category: "equipment", body: "• Hangi Cookers should have a connection directly to the wall gas outlet." },
  { id: "hotBoxes", title: "Hot Boxes", category: "equipment", body: "• Hot boxes used to keep your bulk kai warm.\n• Just turn on and turn off as needed.\n• Make sure on your final clean to give it a wipe out and switch off." },
  { id: "hotWater", title: "Hot Water", category: "equipment", body: "• For immediate hot water use the Urn on the Wall.\n• There maybe in some cases a plug in Urn available to you.\n• Hot water from the taps you must make sure you turn the Gas Switch 1*." },
  { id: "microwave", title: "Microwave", category: "equipment", body: "• Make sure everything is removed and switch off when not in use." },
  { id: "evacuation", title: "Evacuation Point", category: "facilities", body: "• The Evacuation point is located in the front car park by the main road." },
  { id: "firstAid", title: "First Aid", category: "facilities", body: "• The 1st Aid kit is located at the shelf next to the Urn." },
  { id: "flag", title: "Flag / Kara", category: "facilities", body: "• The Flag / Kara will stay up during the whole duration of the hui/tangi/wananga." },
  { id: "floors", title: "Floors", category: "facilities", body: "• Every floor has a different Mop and Bucket.\n• The Green mop and bucket are for the Dining hall only. Use the floor cleaner.\n• The Yellow mop and bucket are for the Kitchen only. Do spot cleans during your time and use the Yellow mop and bucket for your final exit clean. If not, the floor will come up dirty unless its dried. Also use the sjax or Jiff products for this floor.\n• The Blue mop and bucket are for the new and old toilets. Floor cleaner in Ladies Toilet." },
  { id: "linen", title: "Linen", category: "facilities", body: "• All linen is in the Mattress Room Cupboard.\n• On exit day, use the Green Laundry bag that is located in the Cupboard to the left of the linen cupboard and fill up with all of the linen to be collected. Leave the bags in the Mattress Room for collection." },
  { id: "loadingDock", title: "Loading Dock", category: "facilities", body: "• Do not use the Dining Room chairs outside. It ruins the chair foot rubbers.\n• No smoking on the Loading Dock.\n• On the final clean, use the hose on the wall to hose down." },
  { id: "mattressRoom", title: "Mattress Room", category: "facilities", body: "• In the mattress room there is a picture on the left as you walk into the mattress room of how you should leave this space. Please ensure its left in this manner.\n• Under no circumstances is there to be any sleeping in the mattress room. It's a fire exit and must be clear at all times.\n• The fire exit door should not be used unless for emergencies. There is a photo to the left as you enter the Mattress room that shows how you should leave the Mattress Room when finished.\n• Pillows are on the walls.\n• The Topper/Mattress Wall and mattress are in the middle of the room.\n• Whaariki are to the back wall.\n• 6 treacle tables are stored to the back.\n• Vacuum is stacked at the back wall.\n• Blow up mattresses stack in the gap next to it." },
  { id: "lights", title: "Lights", category: "facilities", body: "Wharenui\nThe light switch for the internal lights is located to the left of the entrance door.\n\nWharenui mahau lights (for nighttime)\n• Turn on at nighttime only.\n• Use the main key that opens the toilets and wharenui and open the Ariki room which is the 1st door to the left as you enter the wharenui.\n• Look on the wall and you'll see a Dial. Turn the Dial to On. The lights will turn on around the mahau.\n• Exit the Ariki room and make sure it is locked.\n• In the morning ensure to turn off these lights.\n\nMattress Room\nThe light switch is on the right side as you enter the Mattress room or the back wall by the Fire Alarm.\n\nToilets\nThese switch on automatically when a person enters the toilet. They will turn off after a period of time.\n\nDining Room\nLight switch is located in the kitchen to the left of the storage/dishes room between the Main Switch Board and the door.\n\nOutside and Front Gate Lights\nLight switch is located in the kitchen to the left of the storage/dishes room between the Main Switch Board and the door." },
  { id: "parking", title: "Parking", category: "facilities", body: "• 3 Areas to park.\n• Front Carpark at the Front of the Paa.\n• Back Carpark behind the Wharenui and Kitchen.\n• On the road." },
  { id: "pigBins", title: "Pig Bins", category: "facilities", body: "• There are large Blue pig bins at the back loading dock. Please ensure you only have food scraps in the bin. We will use these scraps in our new composting system.\n• Place the Bins to the left of the Loading Dock." },
  { id: "recyclingBins", title: "Recycling Bins", category: "facilities", body: "• There is a limited amount of recycling bins. Please fill these bins and then place any extra in rubbish bags." },
  { id: "rubbish", title: "Rubbish", category: "facilities", body: "• It is the responsibility of the hirer to remove the rubbish from the paa. However, if you require us to remove the rubbish there is a cost. For some people do hire a skip to get rid of the rubbish. We can provide you details for this.\n• Stack all of the rubbish bags on the grey rack on the loading dock.\n• We do have pig bins which you can use for kai which we use in our composting system." },
  { id: "showers", title: "Showers", category: "facilities", body: "• The Showers use gas which is located at the back of the main toilets. If the Water goes cold, check the Dial which way it's pointing and point it to the opposite side. Then turn on the gas bottle you've pointed the dial to and you should have hot water. Any issues please call The Paa Committee Chairperson 0212749600." },
  { id: "smoking", title: "Smoking", category: "facilities", body: "• Smoking is only permitted by the back Green toilets to the back of the loading dock." },
  { id: "tables", title: "Tables", category: "facilities", body: "• Wharenui tables must stay in the Wharenui. No Dining room tables to be used in the Wharenui.\n• Wharekai tables are stacked on the trolleys and placed in front of the stage." },
  { id: "toilets", title: "Toilets", category: "facilities", body: "• There are 3 sets of toilets that can be used during larger events.\n• The main toilets are to the left of the Wharenui.\n• There are green toilets at the back of the loading dock. These toilets will only be opened for large events. This area is also used for Smoking and Vaping.\n• The final is the front toilets. Due to be completed in November 2025 these will be used mainly for our visitors who come onto the Paa." },
  { id: "trolleys", title: "Trolleys", category: "facilities", body: "• All of the kitchen trolleys must be removed from the kitchen floor and placed in the area where the dishes are stacked on final clean.\n• Ensure these are wiped down and clear of any kai or rubbish." },
  { id: "vacuum", title: "Vacuum", category: "facilities", body: "• The Vacuum is located in the Mattress room of the wharenui. Please use this to do a final clean before exiting the Wharenui.\n• It's a backpack style so easy to use.\n• Please ensure the Vacuum is returned to its proper place." },
  { id: "wifi", title: "WiFi", category: "facilities", body: "• The WiFi Router is located in the Kitchen on the shelf.\n• WiFi password is \"NgaaTaieRua23\"\n• Reception doesn't extend to the Wharenui." },
];

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

  // Source items from the CMS once the admin has content placed on
  // "arrival" (see the Content Manager), falling back to the original
  // hardcoded guide otherwise. Unrecognised categories fall under
  // "Facilities & General" so a mis-typed category never hides an item.
  const items = useMemo(() => {
    if (!usingCms) return FALLBACK_ITEMS;
    return sections.map((item) => {
      const category = GROUP_ORDER.includes(item.category) ? item.category : "facilities";
      return {
        id: String(item.id),
        title: item.title,
        color: GROUP_COLORS[category] || "#2c3e50",
        category,
        body: item.body,
        video_url: item.video_url || null,
      };
    });
  }, [usingCms, sections]);

  // Keep the three known groups first, in their usual order, then any
  // extra groups an admin has invented via a new category name.
  const groupOrder = useMemo(() => {
    const seen = [];
    items.forEach((item) => {
      if (!seen.includes(item.category)) seen.push(item.category);
    });
    return [...GROUP_ORDER.filter((g) => seen.includes(g)), ...seen.filter((g) => !GROUP_ORDER.includes(g))];
  }, [items]);

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

  // Split on whitespace so a search like "gas oven" matches items
  // containing EITHER "gas" OR "oven", not just the exact phrase.
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const words = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      const haystack = `${item.title} ${item.body || ""}`.toLowerCase();
      return words.some((word) => haystack.includes(word));
    });
  }, [items, searchTerm]);

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
      setExpandedSections({});
    } else {
      setExpandedGroupHeaders(allGroupsCollapsed());
      setExpandedSections({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, groupOrder.join(",")]);

  const handleExpandAll = () => {
    const allExpanded = {};
    filteredItems.forEach((item) => {
      allExpanded[item.id] = true;
    });
    setExpandedSections(allExpanded);
    setExpandedGroupHeaders(allGroupsExpanded());
  };

  const handleCollapseAll = () => {
    setExpandedSections({});
    setExpandedGroupHeaders(allGroupsCollapsed());
  };

  const CollapsibleSection = ({ id, title, color, item }) => {
    const isExpanded = expandedSections[id];
    const embedUrl = getYoutubeEmbedUrl(item.video_url);
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
            {(item.body || "").split("\n\n").map((paragraph, pIdx) => (
              <p key={pIdx} style={{ color: "#555", lineHeight: 1.7, margin: 0, marginBottom: "16px", whiteSpace: "pre-line" }}>
                {paragraph}
              </p>
            ))}
            {embedUrl && (
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, marginTop: "12px", borderRadius: "6px", overflow: "hidden" }}>
                <iframe
                  src={embedUrl}
                  title={`${title} video`}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
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

  const itemsByGroup = {};
  groupOrder.forEach((g) => {
    itemsByGroup[g] = filteredItems.filter((item) => item.category === g);
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
        <div style={{ position: "relative", flex: "1", minWidth: "250px" }}>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "1.15rem",
              color: "#999",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="search"
            aria-label="Search sections and content"
            placeholder="Search for an item, e.g. Airconditioning, WiFi, Rubbish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 44px",
              fontSize: "1.05rem",
              border: "2px solid #d4af37",
              borderRadius: "999px",
              fontFamily: "sans-serif",
              outline: "none",
              background: "#fff",
              color: "#2c3e50",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              transition: "box-shadow 0.2s, border-color 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#2c3e50";
              e.target.style.boxShadow = "0 0 0 3px rgba(212,175,55,0.35)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#d4af37";
              e.target.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)";
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#e0e0e0",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                lineHeight: "24px",
                textAlign: "center",
                cursor: "pointer",
                color: "#555",
                fontSize: "0.9rem",
                padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>
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

      {filteredItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#777", fontSize: "1.1rem" }}>
          No sections found matching "{searchTerm}"
        </div>
      ) : (
        <div>
          {groupOrder.map((groupId) =>
            itemsByGroup[groupId].length > 0 ? (
              <CollapsibleGroupHeader key={groupId} groupId={groupId} title={GROUP_LABELS[groupId] || groupId}>
                {itemsByGroup[groupId].map((item) => (
                  <CollapsibleSection key={item.id} id={item.id} title={item.title} color={item.color} item={item} />
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
