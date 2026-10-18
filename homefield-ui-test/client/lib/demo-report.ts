import type { Report } from "./types";

// Deliberately local prototype content so the report UI is visible before the
// backend is connected. The banner in ReportExplorer makes this distinction
// explicit to anyone viewing the page.
export const demoReport: Report = {
  address: "400 Broad St, Seattle, WA 98109",
  lat: 47.6198,
  lon: -122.3489,
  in_king_county: true,
  hazards: {
    flood: {
      status: "no_flooding_seen",
      observed_passes: 140,
      wet_passes: 0,
      first_wet: null,
      last_wet: null,
      source: {
        name: "NASA JPL OPERA DSWx-S1 (prototype data)",
        dates: "Flood-season passes, Sep 2024–Oct 2026",
        resolution_m: 30,
        limitations: [
          "Passes are days apart and can miss a flood’s peak",
          "Radar can miss water under trees and tall crops",
        ],
      },
    },
    heat: {
      status: "ok",
      surface_temp_f: 91.4,
      county_percentile: 72,
      diff_from_median_f: 4.8,
      source: {
        name: "Landsat Collection 2 surface temperature (prototype data)",
        dates: "2025-07-13, 2025-07-29, 2025-08-22",
        resolution_m: 100,
        limitations: [
          "Ground and roof temperature around noon, not air or indoor temperature",
          "Clear summer scenes only",
        ],
      },
    },
    ground_motion: {
      status: "not_enough_data",
      velocity_mm_per_yr: undefined,
      source: {
        name: "NASA JPL OPERA DISP-S1 (prototype data)",
        dates: "Two-year observation window",
        resolution_m: 30,
        limitations: [
          "Measured along the satellite’s slanted view, not straight up and down",
          "Slow movement only, not earthquake shaking",
        ],
      },
    },
  },
};

export const demoSummary =
  "This prototype report did not observe flooding in its satellite passes. The surface was warmer than the county median on the clear summer observation days, while the ground-motion layer could not provide a reliable reading here. For a real address, use the observations as a starting point and check local alerts before making decisions.";
