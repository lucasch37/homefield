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
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "./ui/chart";
import { formatDate, formatNumber, yearSpan } from "@/lib/format";
import type { Hazard, Report } from "@/lib/types";
import {
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverRoot,
  PopoverTrigger,
} from "./ui/popover";
import "./hazard-dashboard.css";

const violet = "#8b5cf6";
const lime = "#c4b5fd";
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
type Severity = "good" | "average" | "hazardous" | "critical" | "unknown";
const severityPalette: Record<
  Severity,
  { bright: string; chart: string; dark: string }
> = {
  good: { bright: "#c4b5fd", chart: "#8b5cf6", dark: "#2e1b4f" },
  average: { bright: "#ffe06b", chart: "#c7a846", dark: "#5a4b20" },
  hazardous: { bright: "#ffc078", chart: "#d77b3e", dark: "#693a23" },
  critical: { bright: "#ff9b91", chart: "#d96f73", dark: "#842d36" },
  unknown: { bright: "#cbd5e1", chart: "#8b7aa8", dark: "#292235" },
};
const severityColor = (severity: Severity) => severityPalette[severity].bright;
const floodSeverity = (hazard?: Hazard): Severity => {
  if (
    !hazard ||
    ["error", "not_enough_data", "not_available"].includes(hazard.status)
  )
    return "unknown";
  if (hazard.status === "permanent_water") return "critical";
  if (hazard.status === "no_flooding_seen") return "good";
  if (!finite(hazard.observed_passes) || !finite(hazard.wet_passes))
    return "unknown";
  const ratio = hazard.wet_passes / hazard.observed_passes;
  if (ratio < 0.05) return "average";
  if (ratio < 0.5) return "hazardous";
  return "critical";
};
const heatSeverity = (hazard?: Hazard): Severity => {
  const percentile = hazard?.lowland_percentile ?? hazard?.county_percentile;
  if (!finite(percentile) || hazard?.status !== "ok") return "unknown";
  if (percentile < 50) return "good";
  if (percentile < 75) return "average";
  if (percentile < 90) return "hazardous";
  return "critical";
};
const groundSeverity = (hazard?: Hazard): Severity => {
  const value = hazard?.velocity_mm_per_yr;
  if (!finite(value) || hazard?.status !== "ok") return "unknown";
  const magnitude = Math.abs(value);
  if (magnitude <= 5) return "good";
  if (magnitude <= 10) return "average";
  if (magnitude <= 20) return "hazardous";
  return "critical";
};
function SeverityScale() {
  return (
    <div className="hfd-severityScale" aria-label="Hazard severity scale">
      {(["good", "average", "hazardous", "critical"] as const).map((level) => (
        <span key={level}>
          <i style={{ background: severityColor(level) }} />
          {level[0].toUpperCase() + level.slice(1)}
        </span>
      ))}
    </div>
  );
}
const available = (hazard?: Hazard) =>
  !!hazard &&
  !["error", "not_available", "not_enough_data"].includes(hazard.status);
function Card({
  title,
  icon: Icon,
  source,
  severity = "unknown",
  children,
  wide = false,
  loading,
}: {
  title: string;
  icon: LucideIcon;
  source?: Hazard;
  severity?: Severity;
  children: ReactNode;
  wide?: boolean;
  loading: boolean;
}) {
  return (
    <article
      className={`hfd-card hfd-tone-${severity} ${wide ? "hfd-wide" : ""}`}
      aria-label={title}
      aria-busy={loading}
    >
      <header className="hfd-cardHeader">
        <h3>
          <span className="hfd-icon" style={{ color: severityColor(severity) }}>
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
  const tone = severityPalette[floodSeverity(hazard)];
  const wetDates =
    hazard?.first_wet && hazard.last_wet
      ? hazard.first_wet === hazard.last_wet
        ? `Water seen on ${formatDate(hazard.first_wet)}.`
        : `Water first seen ${formatDate(hazard.first_wet)}, most recently ${formatDate(hazard.last_wet)}.`
      : null;
  return (
    <>
      <div className="hfd-chartPanel">
        <div className="hfd-metric">
          {passes.toLocaleString()}
          <span>valid passes</span>
        </div>
        <p className="hfd-caption" data-testid="flood-dates">
          {wetDates ?? "A record of what radar satellites could see here."}
        </p>
        <ChartContainer
          config={{ passes: { label: "Satellite passes", color: violet } }}
          className="hfd-passChart"
          aria-label={`${passes} valid satellite passes, ${wet} of them wet`}
        >
          <BarChart
            data={[
              { name: "Valid passes", passes },
              { name: "Wet passes", passes: wet },
            ]}
            margin={{ top: 25, right: 22, left: 22, bottom: 0 }}
            barSize={64}
          >
            <defs>
              <linearGradient id={`bars-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tone.bright} />
                <stop offset="100%" stopColor={tone.chart} />
              </linearGradient>
              <pattern
                id={`hatch-${id}`}
                width="5"
                height="5"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(35)"
              >
                <rect width="5" height="5" fill={tone.dark} />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="5"
                  stroke={tone.bright}
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
              cursor={{ fill: tone.bright, radius: 8 }}
              content={
                <ChartTooltipContent hideLabel className="hfd-tooltip" />
              }
            />
            <Bar
              dataKey="passes"
              radius={[7, 7, 0, 0]}
              isAnimationActive={false}
              activeBar={{
                fill: tone.bright,
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            >
              <Cell fill={`url(#bars-${id})`} />
              <Cell fill={`url(#hatch-${id})`} />
              <LabelList
                position="top"
                dataKey="passes"
                fill={tone.bright}
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
  const tone = severityPalette[floodSeverity(hazard)];
  // The ring's arc is drawn from the API's two counts; only those counts are printed.
  const share = wet / passes;
  const circumference = 2 * Math.PI * 67;
  return (
    <>
      <div className="hfd-chartPanel hfd-frequencyPanel">
        <div className="hfd-ringWrap">
          <svg
            className="hfd-ring"
            viewBox="0 0 180 180"
            role="img"
            aria-label={`Water observed in ${wet} of ${passes} valid passes`}
          >
            <circle
              cx="90"
              cy="90"
              r="67"
              fill="none"
              stroke={tone.dark}
              strokeWidth="10"
            />
            <circle
              cx="90"
              cy="90"
              r="67"
              fill="none"
              stroke={tone.bright}
              strokeWidth="10"
              strokeLinecap={share ? "round" : "butt"}
              strokeDasharray={`${circumference * share} ${circumference}`}
              transform="rotate(-90 90 90)"
            />
          </svg>
          <div className="hfd-ringLabel">
            <strong>
              {wet.toLocaleString()}
              <small> / {passes.toLocaleString()}</small>
            </strong>
            <span>passes saw water</span>
          </div>
        </div>
        <div className="hfd-legendRow">
          <span>
            <i style={{ background: tone.bright }} />
            Wet passes
          </span>
          <strong>{wet.toLocaleString()}</strong>
        </div>
        <div className="hfd-legendRow">
          <span>
            <i style={{ background: tone.chart }} />
            Valid passes
          </span>
          <strong>{passes.toLocaleString()}</strong>
        </div>
        <p className="hfd-note">
          Observation frequency, not future flood probability.
        </p>
      </div>
    </>
  );
}

function HeatGauge({ hazard }: { hazard?: Hazard }) {
  const percentile = hazard?.lowland_percentile;
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
  const tone = severityPalette[heatSeverity(hazard)];
  return (
    <>
      <div className="hfd-chartPanel hfd-gaugePanel">
        <div className="hfd-gaugeWrap">
          <svg
            viewBox="0 0 260 155"
            className="hfd-gauge"
            role="img"
            aria-label={`Relative surface heat at the ${formatNumber(percentile)} percentile of lowland King County`}
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
                  stroke={(i / 24) * 100 < percentile ? tone.bright : tone.dark}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div className="hfd-gaugeLabel">
            <span>LOWLAND PERCENTILE</span>
            <strong>
              {formatNumber(percentile)}
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
                  {formatNumber(Math.abs(hazard.recent_relative_f))}°F
                </strong>{" "}
                {hazard.recent_relative_f === 0
                  ? "same as"
                  : hazard.recent_relative_f > 0
                    ? "hotter than"
                    : "cooler than"}{" "}
                a typical lowland spot on the same clear days
              </>
            ) : (
              "Compared with lowland King County surfaces"
            )}
          </p>
        </div>
      </div>
    </>
  );
}

function GroundMotion({ hazard }: { hazard?: Hazard }) {
  const value = hazard?.velocity_mm_per_yr;
  const series = (hazard?.series_mm ?? []).map((point) => ({
    date: point.date,
    mm: point.mm,
  }));
  const plotted = series.filter((point) => finite(point.mm)).length;
  return (
    <>
      <div className="hfd-groundBody">
        {available(hazard) && finite(value) ? (
          <>
            <div className="hfd-metric">
              {formatNumber(value)}
              <span>mm / year</span>
            </div>
            <div
              className="hfd-groundVisual"
              role="img"
              aria-label={`Ground movement magnitude ${Math.abs(value).toFixed(1)} millimeters per year`}
            >
              <div className="hfd-groundMeter">
                <span
                  className="hfd-groundMarker"
                  style={{
                    left: `${Math.min((Math.abs(value) / 20) * 100, 100)}%`,
                    color: severityColor(groundSeverity(hazard)),
                  }}
                >
                  <Activity size={20} strokeWidth={2} />
                </span>
              </div>
              <div className="hfd-groundScale" aria-hidden="true">
                <span>0</span>
                <span>5</span>
                <span>10</span>
                <span>20+</span>
              </div>
              <p className="hfd-groundBand">
                {groundSeverity(hazard)[0].toUpperCase() +
                  groundSeverity(hazard).slice(1)}{" "}
                measured movement
              </p>
            </div>
            {plotted >= 2 ? (
              <ChartContainer
                config={{
                  mm: { label: "Cumulative movement (mm)", color: lime },
                }}
                className="hfd-groundChart"
                aria-label={`Cumulative movement from ${formatDate(series[0].date)} to ${formatDate(series[series.length - 1].date)}`}
              >
                <LineChart
                  data={series}
                  margin={{ top: 12, right: 8, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#ffffff1c"
                    strokeDasharray="3 4"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#c3d4c8", fontSize: 9 }}
                    tickFormatter={(date: string) => date.slice(0, 4)}
                    interval="preserveStartEnd"
                    minTickGap={18}
                  />
                  <YAxis hide domain={["auto", "auto"]} />
                  <ReferenceLine y={0} stroke="#ffffff40" />
                  <Tooltip
                    content={
                      <ChartTooltipContent
                        className="hfd-tooltip"
                        labelFormatter={(_, payload) =>
                          formatDate(String(payload?.[0]?.payload?.date ?? ""))
                        }
                        formatter={(v) => (
                          <span className="hfd-tooltipValue">
                            {formatNumber(Number(v))} mm
                          </span>
                        )}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="mm"
                    stroke={severityColor(groundSeverity(hazard))}
                    strokeWidth={2}
                    dot={{
                      r: 2.5,
                      fill: severityColor(groundSeverity(hazard)),
                    }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="hfd-groundSymbol" aria-hidden="true">
                <Activity size={40} strokeWidth={1} />
              </div>
            )}
            <p className="hfd-note">
              Cumulative movement along the satellite’s slanted line of sight.
              The sign’s direction hasn’t been verified, so this doesn’t say
              whether the ground is rising or sinking.
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

function HeatHistory({ hazard }: { hazard?: Hazard }) {
  const years = hazard?.yearly_relative_f ?? [];
  const data = years.map((point) => ({
    year: String(point.year),
    relative: point.relative_f,
  }));
  const plotted = data.filter((point) => finite(point.relative)).length;
  if (!available(hazard) || plotted < 2)
    return (
      <Empty
        hazard={hazard}
        text="Year-by-year heat readings weren’t available for this spot."
      />
    );
  const tone = severityPalette[heatSeverity(hazard)];
  const recent = hazard?.recent_relative_f;
  const change = hazard?.change_since_early_f;
  const ChangeIcon =
    finite(change) && change < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <>
      <div className="hfd-chartPanel hfd-heatPanel">
        <div className="hfd-comparisonHeading">
          <div>
            {finite(recent) && (
              <div className="hfd-metric">
                {recent > 0 ? "+" : ""}
                {formatNumber(recent)}
                <span>
                  °F vs. a typical lowland spot (
                  {yearSpan(hazard?.recent_years)})
                </span>
              </div>
            )}
            <p className="hfd-caption">
              Each summer: how much hotter (+) or cooler (−) this spot’s surface
              ran than a typical lowland King County spot
            </p>
          </div>
          {finite(change) && hazard?.early_years?.length ? (
            <span className="hfd-delta">
              <ChangeIcon size={13} />
              {change > 0 ? "+" : ""}
              {formatNumber(change)}°F{" "}
              <span>since {yearSpan(hazard.early_years)}</span>
            </span>
          ) : null}
        </div>
        <ChartContainer
          config={{
            relative: { label: "Difference from typical (°F)", color: lime },
          }}
          className="hfd-comparisonChart"
          aria-label={`Yearly surface heat compared with lowland King County, ${data[0].year} to ${data[data.length - 1].year}`}
        >
          <BarChart
            data={data}
            margin={{ top: 14, right: 6, left: 6, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#ffffff1c"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#c3d4c8", fontSize: 9 }}
              interval="preserveStartEnd"
              minTickGap={6}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <ReferenceLine y={0} stroke="#ffffff55" />
            <Tooltip
              cursor={{ fill: tone.bright }}
              content={
                <ChartTooltipContent
                  className="hfd-tooltip"
                  formatter={(v) => (
                    <span className="hfd-tooltipValue">
                      {Number(v) > 0 ? "+" : ""}
                      {formatNumber(Number(v))}°F
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey="relative"
              radius={[4, 4, 4, 4]}
              isAnimationActive={false}
            >
              {data.map((point) => (
                <Cell
                  key={point.year}
                  fill={
                    finite(point.relative) && point.relative > 0
                      ? tone.bright
                      : tone.chart
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <p className="hfd-note">
          Ground and roof surface temperature around noon on clear summer days,
          not air temperature. Years without a clear reading are left blank.
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
  return (
    <section className="hfd-dashboard" aria-labelledby="dashboard-title">
      <div className="hfd-heading">
        <div>
          <h2 id="dashboard-title">The satellite record</h2>
        </div>
        <SeverityScale />
      </div>
      <div className="hfd-grid">
        <Card
          title="Satellite pass history"
          icon={Droplets}
          source={report?.hazards.flood}
          severity={floodSeverity(report?.hazards.flood)}
          loading={loading}
        >
          <FloodPasses hazard={report?.hazards.flood} />
        </Card>
        <Card
          title="Water detection"
          icon={Waves}
          source={report?.hazards.flood}
          severity={floodSeverity(report?.hazards.flood)}
          loading={loading}
        >
          <WaterFrequency hazard={report?.hazards.flood} />
        </Card>
        <Card
          title="Heat in perspective"
          icon={Sun}
          source={report?.hazards.heat}
          severity={heatSeverity(report?.hazards.heat)}
          loading={loading}
        >
          <HeatGauge hazard={report?.hazards.heat} />
        </Card>
        <Card
          title="Ground movement"
          icon={Activity}
          source={report?.hazards.ground_motion}
          severity={groundSeverity(report?.hazards.ground_motion)}
          loading={loading}
        >
          <GroundMotion hazard={report?.hazards.ground_motion} />
        </Card>
        <Card
          title="Heat over the years"
          icon={Sun}
          source={report?.hazards.heat}
          severity={heatSeverity(report?.hazards.heat)}
          loading={loading}
          wide
        >
          <HeatHistory hazard={report?.hazards.heat} />
        </Card>
      </div>
      <p className="hfd-dashboardNote">
        <ScanLine size={13} />
        Every chart shows values from the satellite data as returned for this
        location. Open “Source” for dates, resolution, and limitations.
      </p>
    </section>
  );
}
