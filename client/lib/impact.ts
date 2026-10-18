// What each finding means for living at a place, and what to check before deciding. These notes are
// reviewed by hand: no numbers, no predictions, no legal, insurance, or medical advice, and never "safe".
// Bands follow the dashboard's severity colors so the words match the cards.

import { groundSeverity, heatSeverity } from "./severity.ts";
import type { Hazard, HazardKind } from "./types.ts";

/** `phrase` is completed by the places it applies to ("water showed up at A and C"); `stake` is what a
 * notable finding affects, and is empty when the finding isn't a concern. */
export type Impact = { meaning: string; check: string; phrase: string; stake: string };

const NONE: Impact = { meaning: "", check: "", phrase: "", stake: "" };

function flood(hazard: Hazard): Impact {
  switch (hazard.status) {
    case "flooded":
      return {
        meaning: "Water reached this spot at least once while satellites were watching, which matters most for basements, crawl spaces, ground-floor rooms, and yards.",
        check: "Ask the seller or landlord about past water, look for water stains, and sign up for flood alerts.",
        phrase: "water showed up in the satellite record at",
        stake: "basements, crawl spaces, ground-floor rooms, and yards",
      };
    case "permanent_water":
      return {
        meaning: "Because the pin sits on or beside open water, this reading says more about the water than about the house itself.",
        check: "Confirm where the home sits and how close its living space is to the shoreline.",
        phrase: "the pin sits on or beside open water at",
        stake: "",
      };
    case "no_flooding_seen":
      return {
        meaning: "No flooding showed up in the satellite record, a good sign for basements and ground-floor rooms, though not a guarantee.",
        check: "Look at King County flood maps and ask about the property’s history.",
        phrase: "the satellite record was dry at",
        stake: "",
      };
    default:
      return {
        meaning: "Satellites couldn’t tell whether this spot has flooded.",
        check: "Rely on King County flood maps and the property’s history.",
        phrase: "the flood record was inconclusive at",
        stake: "",
      };
  }
}

function heat(hazard: Hazard): Impact {
  if (hazard.status === "not_available") return NONE;
  switch (heatSeverity(hazard)) {
    case "critical":
      return {
        meaning: "Surfaces here run hotter than almost anywhere in lowland King County, which can mean hotter rooms, more need for cooling, and less comfortable outdoor space in summer.",
        check: "Ask about air conditioning, insulation, and shade trees.",
        phrase: "surfaces run much hotter than typical at",
        stake: "how hot rooms, upper floors, and outdoor space get in summer",
      };
    case "hazardous":
      return {
        meaning: "Summer afternoons can feel hotter here, especially on upper floors and in paved yards.",
        check: "Look at shade, ventilation, and cooling options.",
        phrase: "surfaces run hotter than typical at",
        stake: "how hot rooms, upper floors, and outdoor space get in summer",
      };
    case "good":
    case "average":
      return {
        meaning: "Summer surface heat here is typical or cooler for lowland King County, so it isn’t a standout concern.",
        check: "",
        phrase: "summer heat is typical or cooler at",
        stake: "",
      };
    default:
      return {
        meaning: "There’s no reliable heat reading here, so summer heat is an open question.",
        check: "Ask how the home stays cool in summer.",
        phrase: "the heat reading was unreliable at",
        stake: "",
      };
  }
}

function ground(hazard: Hazard): Impact {
  if (hazard.status === "not_available") return NONE;
  switch (groundSeverity(hazard)) {
    case "critical":
    case "hazardous":
      return {
        meaning: "Steady slow ground movement can show up over years as cracks, sticking doors, or uneven floors.",
        check: "Have an inspector look closely at the foundation.",
        phrase: "steady slow ground movement was measured at",
        stake: "foundations, walls, and doors over the years",
      };
    case "good":
    case "average":
      return {
        meaning: "The slow ground movement measured here is small.",
        check: "A normal home inspection should cover the foundation.",
        phrase: "only small ground movement was measured at",
        stake: "",
      };
    default:
      return {
        meaning: "Satellites couldn’t measure ground movement here.",
        check: "A home inspection is the main way to check the foundation.",
        phrase: "ground movement readings were unavailable at",
        stake: "",
      };
  }
}

const BUILDERS: Record<HazardKind, (hazard: Hazard) => Impact> = { flood, heat, ground_motion: ground };

export function impactFor(kind: HazardKind, hazard: Hazard): Impact {
  return BUILDERS[kind](hazard);
}
