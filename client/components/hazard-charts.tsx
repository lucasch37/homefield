"use client";

import { useId, type ReactNode } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Droplets,
  ScanLine,
  Sun,
  Waves,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "./ui/chart";
import type { Hazard, HazardKind, Report } from "@/lib/types";
import {
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverRoot,
  PopoverTrigger,
} from "./ui/popover";
import "./hazard-dashboard.css";

const green = "#164e3e";
const lime = "#c4df85";
const alertBright = "#ffb0a2";
const alertMid = "#d96f73";
const alertMuted = "#b85d64";
const alertDark = "#842d36";
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const available = (hazard?: Hazard) =>
  !!hazard &&
  !["error", "not_available", "not_enough_data"].includes(hazard.status);
const hasHazardSignal = (hazard: Hazard | undefined, kind: HazardKind) => {
  if (!hazard) return false;
  if (kind === "flood") return hazard.status === "flooded";
  if (kind === "heat") {
    if (hazard.status !== "ok") return false;
    if (finite(hazard.recent_relative_f)) return hazard.recent_relative_f > 0;
    if (finite(hazard.lowland_percentile))
      return hazard.lowland_percentile > 50;
    if (finite(hazard.diff_from_median_f)) return hazard.diff_from_median_f > 0;
    return finite(hazard.county_percentile) && hazard.county_percentile > 50;
  }
  return (
    hazard.status === "ok" &&
    finite(hazard.velocity_mm_per_yr) &&
    hazard.velocity_mm_per_yr !== 0
  );
};

function Card({
  title,
  icon: Icon,
  source,
  alert,
  children,
  wide = false,
  loading,
}: {
  title: string;
  icon: LucideIcon;
  source?: Hazard;
  alert?: boolean;
  children: ReactNode;
  wide?: boolean;
  loading: boolean;
}) {
  return (
    <article
      className={`hfd-card ${wide ? "hfd-wide" : ""} ${alert ? "hfd-alert" : ""}`}
      aria-label={title}
      aria-busy={loading}
    >
      <header className="hfd-cardHeader">
        <h3>
          <span className="hfd-icon">
            <Icon size={15} strokeWidth={1.7} />
          </span>
          {title}
        </h3>
        {!loading && <Source hazard={source} />}
      </header>
      {loading ? (
        <div
          className="hfd-skeleton"
          aria-label={`Loading ${title.toLowerCase()}`}
        >
          <span />
          <span />
          <span />
        </div>
      ) : (
        children
      )}
    </article>
  );
}

function Source({ hazard }: { hazard?: Hazard }) {
  if (!hazard) return null;
  return (
    <PopoverRoot className="hfd-sourceControl" sharedLayout={false}>
      <PopoverTrigger className="hfd-sourceTrigger">
        <ScanLine size={13} />
        <span>Source</span>
      </PopoverTrigger>
      <PopoverContent className="hfd-sourcePopover">
        <PopoverHeader className="hfd-sourcePopoverHeader">
          <span>Observation source</span>
          <PopoverCloseButton className="hfd-sourceClose" />
        </PopoverHeader>
        <PopoverBody className="hfd-sourcePopoverBody">
          <dl>
            <div>
              <dt>Source</dt>
              <dd>{hazard.source.name}</dd>
            </div>
            <div>
              <dt>Observed</dt>
              <dd>{hazard.source.dates || "Observation dates unavailable"}</dd>
            </div>
            <div>
              <dt>Resolution</dt>
              <dd>
                {hazard.source.resolution_m !== null
                  ? `${hazard.source.resolution_m} m`
                  : "Not provided"}
              </dd>
            </div>
          </dl>
          <h4>What this can’t tell you</h4>
          {hazard.source.limitations.length > 0 ? (
            <ul>
              {hazard.source.limitations.map((limitation, index) => (
                <li key={index}>{limitation}</li>
              ))}
            </ul>
          ) : (
            <p>Limitations were not provided by the data service.</p>
          )}
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
}

function Empty({ hazard, text }: { hazard?: Hazard; text?: string }) {
  return (
    <div className="hfd-empty">
      <span className="hfd-emptyIcon">
        <ScanLine size={23} strokeWidth={1.3} />
      </span>
      <strong>
        {hazard?.status === "error"
          ? "Layer unavailable"
          : hazard?.status === "not_available"
            ? "Not available yet"
            : hazard
              ? "More observations needed"
              : "Your report starts here"}
      </strong>
      <p>
        {hazard?.message ||
          (hazard?.status === "error"
            ? "This layer couldn’t load. Other observations are still available."
            : hazard?.status === "not_available"
              ? "This observation layer isn’t available yet."
              : text ||
                (hazard
                  ? "Satellites couldn’t get a reliable reading here."
                  : "Search a King County address to explore its satellite observations."))}
      </p>
    </div>
  );
}

function FloodPasses({ hazard }: { hazard?: Hazard }) {
  const id = useId().replaceAll(":", "");
  const passes = hazard?.observed_passes;
  const wet = hazard?.wet_passes;
  if (
    !available(hazard) ||
    !finite(passes) ||
    !finite(wet) ||
    passes <= 0 ||
    wet < 0 ||
    wet > passes
  )
    return <Empty hazard={hazard} />;
  const alert = hasHazardSignal(hazard, "flood");
  const dry = passes - wet;
  return (
    <>
      <div className="hfd-chartPanel">
        <div className="hfd-metric">
          {passes.toLocaleString()}
          <span>valid passes</span>
        </div>
        <p className="hfd-caption">A record of what satellites could see.</p>
        <ChartContainer
          config={{ passes: { label: "Satellite passes", color: green } }}
          className="hfd-passChart"
          aria-label={`${dry} dry satellite passes and ${wet} wet satellite passes`}
        >
          <BarChart
            data={[
              { name: "Dry passes", passes: dry },
              { name: "Wet passes", passes: wet },
            ]}
            margin={{ top: 25, right: 22, left: 22, bottom: 0 }}
            barSize={64}
          >
            <defs>
              <linearGradient id={`bars-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={alert ? alertBright : "#a9d291"} />
                <stop offset="100%" stopColor={alert ? alertMid : "#5ca87d"} />
              </linearGradient>
              <pattern
                id={`hatch-${id}`}
                width="5"
                height="5"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(35)"
              >
                <rect
                  width="5"
                  height="5"
                  fill={alert ? alertDark : "#174d3a"}
                />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="5"
                  stroke={alert ? alertBright : "#83a98a"}
                  strokeWidth="1.5"
                />
              </pattern>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#ffffff1c"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#c3d4c8", fontSize: 10 }}
              dy={5}
            />
            <YAxis hide domain={[0, passes]} />
            <Tooltip
              cursor={{ fill: alert ? alertDark : "#164b38", radius: 8 }}
              content={
                <ChartTooltipContent hideLabel className="hfd-tooltip" />
              }
            />
            <Bar
              dataKey="passes"
              radius={[7, 7, 0, 0]}
              isAnimationActive={false}
              activeBar={{
                fill: alert ? alertMid : "#7db78a",
                stroke: alert ? alertBright : lime,
                strokeWidth: 2,
              }}
            >
              <Cell fill={`url(#bars-${id})`} />
              <Cell fill={`url(#hatch-${id})`} />
              <LabelList
                position="top"
                dataKey="passes"
                fill={alert ? alertBright : lime}
                fontSize={11}
                fontWeight={600}
                offset={9}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </>
  );
}

function WaterFrequency({ hazard }: { hazard?: Hazard }) {
  const passes = hazard?.observed_passes;
  const wet = hazard?.wet_passes;
  if (
    !available(hazard) ||
    !finite(passes) ||
    !finite(wet) ||
    passes <= 0 ||
    wet < 0 ||
    wet > passes
  )
    return <Empty hazard={hazard} />;
  const alert = hasHazardSignal(hazard, "flood");
  const percentage = (wet / passes) * 100;
  const circumference = 2 * Math.PI * 67;
  return (
    <>
      <div className="hfd-chartPanel hfd-frequencyPanel">
        <div className="hfd-ringWrap">
          <svg
            className="hfd-ring"
            viewBox="0 0 180 180"
            role="img"
            aria-label={`Water observed in ${wet} of ${passes} passes, ${percentage.toFixed(1)} percent`}
          >
            <circle
              cx="90"
              cy="90"
              r="67"
              fill="none"
              stroke={alert ? "#8f3b43" : "#285b43"}
              strokeWidth="10"
            />
            <circle
              cx="90"
              cy="90"
              r="67"
              fill="none"
              stroke={alert ? alertBright : lime}
              strokeWidth="10"
              strokeLinecap={percentage ? "round" : "butt"}
              strokeDasharray={`${(circumference * percentage) / 100} ${circumference}`}
              transform="rotate(-90 90 90)"
            />
          </svg>
          <div className="hfd-ringLabel">
            <strong>
              {Number(percentage.toFixed(1))}
              <small>%</small>
            </strong>
            <span>of passes saw water</span>
          </div>
        </div>
        <div className="hfd-legendRow">
          <span>
            <i style={{ background: alert ? alertBright : lime }} />
            Wet passes
          </span>
          <strong>{wet.toLocaleString()}</strong>
        </div>
        <div className="hfd-legendRow">
          <span>
            <i style={{ background: alert ? alertMuted : "#83a98a" }} />
            Dry passes
          </span>
          <strong>{(passes - wet).toLocaleString()}</strong>
        </div>
        <p className="hfd-note">
          Observation frequency, not future flood probability.
        </p>
      </div>
    </>
  );
}

function HeatGauge({ hazard }: { hazard?: Hazard }) {
  const percentile = hazard?.lowland_percentile ?? hazard?.county_percentile;
  if (
    !available(hazard) ||
    !finite(percentile) ||
    percentile < 0 ||
    percentile > 100
  )
    return (
      <Empty
        hazard={hazard}
        text="A relative heat percentile wasn’t provided for this location."
      />
    );
  const alert = hasHazardSignal(hazard, "heat");
  return (
    <>
      <div className="hfd-chartPanel hfd-gaugePanel">
        <div className="hfd-gaugeWrap">
          <svg
            viewBox="0 0 260 155"
            className="hfd-gauge"
            role="img"
            aria-label={`Surface temperature at county percentile ${percentile}`}
          >
            {Array.from({ length: 25 }, (_, i) => {
              const angle = Math.PI + (i / 24) * Math.PI;
              return (
                <line
                  key={i}
                  x1={(130 + Math.cos(angle) * 88).toFixed(3)}
                  y1={(124 + Math.sin(angle) * 88).toFixed(3)}
                  x2={(130 + Math.cos(angle) * 109).toFixed(3)}
                  y2={(124 + Math.sin(angle) * 109).toFixed(3)}
                  stroke={
                    (i / 24) * 100 < percentile
                      ? alert
                        ? alertBright
                        : lime
                      : alert
                        ? "#8f3b43"
                        : "#285b43"
                  }
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div className="hfd-gaugeLabel">
            <span>
              {finite(hazard?.lowland_percentile)
                ? "LOWLAND PERCENTILE"
                : "COUNTY PERCENTILE"}
            </span>
            <strong>
              {Number(percentile.toFixed(1))}
              <small> / 100</small>
            </strong>
          </div>
        </div>
        <div className="hfd-gaugeScale">
          <span>Cooler surfaces</span>
          <span>Warmer surfaces</span>
        </div>
        <div className="hfd-callout">
          <Sun size={15} />
          <p>
            {finite(hazard?.recent_relative_f) ? (
              <>
                <strong>
                  {Math.abs(hazard.recent_relative_f).toFixed(1)}°F
                </strong>{" "}
                {hazard.recent_relative_f === 0
                  ? "at"
                  : hazard.recent_relative_f > 0
                    ? "above"
                    : "below"}{" "}
                each clear day’s lowland median
              </>
            ) : finite(hazard?.diff_from_median_f) ? (
              <>
                <strong>
                  {Math.abs(hazard.diff_from_median_f).toFixed(1)}°F
                </strong>{" "}
                {hazard.diff_from_median_f === 0
                  ? "at"
                  : hazard.diff_from_median_f > 0
                    ? "above"
                    : "below"}{" "}
                the county median
              </>
            ) : (
              "Relative to observed land surfaces"
            )}
          </p>
        </div>
      </div>
    </>
  );
}

function GroundMotion({ hazard }: { hazard?: Hazard }) {
  const value = hazard?.velocity_mm_per_yr;
  return (
    <>
      <div className="hfd-groundBody">
        {available(hazard) && finite(value) ? (
          <>
            <div className="hfd-metric">
              {value.toFixed(1)}
              <span>mm / year</span>
            </div>
            <div className="hfd-groundSymbol" aria-hidden="true">
              <Activity size={40} strokeWidth={1} />
            </div>
            <p className="hfd-note">
              Measured along the satellite’s line of sight. Direction requires a
              verified source sign convention.
            </p>
          </>
        ) : (
          <Empty
            hazard={hazard}
            text="No reliable movement trend to draw. A missing reading doesn’t mean the ground is still."
          />
        )}
      </div>
    </>
  );
}

function HeatComparison({ hazard }: { hazard?: Hazard }) {
  const value = hazard?.surface_temp_f;
  const difference = hazard?.recent_relative_f ?? hazard?.diff_from_median_f;
  const id = useId().replaceAll(":", "");
  if (!available(hazard) || !finite(value)) return <Empty hazard={hazard} />;
  const alert = hasHazardSignal(hazard, "heat");
  const hasMedian = finite(difference);
  const median = hasMedian ? value - difference : null;
  const comparisonLabel = finite(hazard?.recent_relative_f)
    ? "Daily lowland median"
    : "County median";
  const data = [
    { name: "This address", temperature: value },
    ...(median !== null
      ? [{ name: comparisonLabel, temperature: median }]
      : []),
  ];
  const DifferenceIcon =
    finite(difference) && difference < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <>
      <div className="hfd-chartPanel hfd-heatPanel">
        <div className="hfd-comparisonHeading">
          <div>
            <div className="hfd-metric">
              {value.toFixed(1)}
              <span>°F</span>
            </div>
            <p className="hfd-caption">Ground & roof surface temperature</p>
          </div>
          {hasMedian && (
            <span className="hfd-delta">
              <DifferenceIcon size={13} />
              {difference > 0 ? "+" : ""}
              {difference.toFixed(1)}°F{" "}
              <span>
                {finite(hazard?.recent_relative_f)
                  ? "vs. lowland"
                  : "vs. county"}
              </span>
            </span>
          )}
        </div>
        <ChartContainer
          config={{
            temperature: { label: "Surface temperature (°F)", color: green },
          }}
          className="hfd-comparisonChart"
          aria-label={`Surface temperature: this address ${value.toFixed(1)} degrees Fahrenheit${median !== null ? `, ${comparisonLabel.toLowerCase()} ${median.toFixed(1)} degrees Fahrenheit` : ", relative comparison unavailable"}`}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 56, bottom: 0, left: 0 }}
            barSize={27}
          >
            <defs>
              <linearGradient id={`heat-${id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={alert ? alertBright : "#a9d291"} />
                <stop offset="100%" stopColor={alert ? alertMid : "#5ca87d"} />
              </linearGradient>
            </defs>
            <CartesianGrid
              horizontal={false}
              stroke="#ffffff1c"
              strokeDasharray="3 4"
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#c3d4c8", fontSize: 9 }}
              tickFormatter={(v: number) => `${v}°`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#d7e4da", fontSize: 10 }}
            />
            <Tooltip
              cursor={{ fill: alert ? alertDark : "#164b38" }}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="hfd-tooltip"
                  formatter={(v) => (
                    <span className="hfd-tooltipValue">
                      {Number(v).toFixed(1)}°F
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey="temperature"
              radius={[0, 5, 5, 0]}
              isAnimationActive={false}
              activeBar={{
                fill: alert ? alertMid : "#7db78a",
                stroke: alert ? alertBright : lime,
                strokeWidth: 2,
              }}
            >
              <Cell fill={`url(#heat-${id})`} />
              <Cell fill={alert ? alertMuted : "#83a98a"} />
              <LabelList
                position="right"
                fill={alert ? alertBright : lime}
                fontSize={10}
                fontWeight={600}
                offset={10}
                formatter={(v: unknown) =>
                  finite(v) ? `${v.toFixed(1)}°F` : ""
                }
              />
            </Bar>
          </BarChart>
        </ChartContainer>
        <p className="hfd-note">
          {hasMedian
            ? finite(hazard?.recent_relative_f)
              ? "The comparison uses each clear day’s lowland median."
              : "County median is calculated from the same observed scenes."
            : "Relative comparison unavailable."}{" "}
          Surface temperature is not air or indoor temperature.
        </p>
      </div>
    </>
  );
}

export function HazardDashboard({
  report,
  loading,
}: {
  report: Report | null;
  loading: boolean;
}) {
  const floodAlert = hasHazardSignal(report?.hazards.flood, "flood");
  const heatAlert = hasHazardSignal(report?.hazards.heat, "heat");
  const groundAlert = hasHazardSignal(
    report?.hazards.ground_motion,
    "ground_motion",
  );
  return (
    <section className="hfd-dashboard" aria-labelledby="dashboard-title">
      <div className="hfd-heading">
        <div>
          <h2 id="dashboard-title">The sattelite data</h2>
        </div>
      </div>
      <div className="hfd-grid">
        <Card
          title="Satellite pass history"
          icon={Droplets}
          source={report?.hazards.flood}
          alert={floodAlert}
          loading={loading}
        >
          <FloodPasses hazard={report?.hazards.flood} />
        </Card>
        <Card
          title="Water detection"
          icon={Waves}
          source={report?.hazards.flood}
          alert={floodAlert}
          loading={loading}
        >
          <WaterFrequency hazard={report?.hazards.flood} />
        </Card>
        <Card
          title="Heat in perspective"
          icon={Sun}
          source={report?.hazards.heat}
          alert={heatAlert}
          loading={loading}
        >
          <HeatGauge hazard={report?.hazards.heat} />
        </Card>
        <Card
          title="Ground movement"
          icon={Activity}
          source={report?.hazards.ground_motion}
          alert={groundAlert}
          loading={loading}
        >
          <GroundMotion hazard={report?.hazards.ground_motion} />
        </Card>
        <Card
          title="Surface temperature"
          icon={Sun}
          source={report?.hazards.heat}
          alert={heatAlert}
          loading={loading}
          wide
        >
          <HeatComparison hazard={report?.hazards.heat} />
        </Card>
      </div>
      <p className="hfd-dashboardNote">
        <ScanLine size={13} />A view of the satellite record. Every reading has
        limits; explore the findings below for context.
      </p>
    </section>
  );
}
