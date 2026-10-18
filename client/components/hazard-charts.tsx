"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Droplets,
  Satellite,
  ScanLine,
  Sun,
  Waves,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "./ui/chart";
import { finding, glance, hazardMeta, headline } from "@/lib/hazards";
import {
  hazardKinds,
  type Hazard,
  type HazardKind,
  type Report,
  type YearHeat,
} from "@/lib/types";
import {
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverRoot,
  PopoverTrigger,
} from "./ui/popover";
import "./hazard-dashboard.css";

const HAZARD_STYLE: Record<HazardKind, { icon: LucideIcon; color: string }> = {
  flood: { icon: Droplets, color: "#38bdf8" },
  heat: { icon: Sun, color: "#fb923c" },
  ground_motion: { icon: Waves, color: "#a78bfa" },
};
const COOLER = "#38bdf8";
const AXIS_TICK = { fill: "#8b93b8", fontSize: 10 };
const GRID_STROKE = "rgb(255 255 255 / 7%)";
const ZERO_STROKE = "rgb(255 255 255 / 32%)";
const MAX_PASS_CELLS = 420;
const EMPTY_NOTE: Record<HazardKind, string> = {
  flood: "Too few clear radar passes to judge. This doesn’t rule out flooding.",
  heat: "Clouds and missing scenes can leave gaps in the heat record.",
  ground_motion: "A missing reading doesn’t mean the ground is still.",
};
const EMPTY_CHART: Record<HazardKind, string> = {
  flood: "No radar pass record to draw here.",
  heat: "No summer heat record to draw here.",
  ground_motion: "No movement history to draw here.",
};

type Stat = { label: string; value: string; detail?: string };
type PanelContent = { stats: Stat[]; chart: ReactNode; note: string };
type Reading = { date: string; mm: number };

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
const yearRange = (years: number[] = []) => {
  if (years.length === 0) return "";
  const first = Math.min(...years);
  const last = Math.max(...years);
  return first === last ? String(first) : `${first}–${last}`;
};
const signed = (value: number, digits = 1) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(digits)}`;
const ordinal = (value: number) => {
  const tens = value % 100;
  const suffix =
    tens >= 11 && tens <= 13 ? "th" : (["th", "st", "nd", "rd"][value % 10] ?? "th");
  return `${value}${suffix}`;
};
const dateValue = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};
const formatDate = (date: string | number) =>
  new Date(typeof date === "number" ? date : dateValue(date)).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" },
  );

function floodContent(hazard: Hazard): PanelContent | null {
  const passes = hazard.observed_passes;
  const wet = hazard.wet_passes;
  if (
    !available(hazard) ||
    !finite(passes) ||
    !finite(wet) ||
    passes <= 0 ||
    wet < 0 ||
    wet > passes
  )
    return null;
  const stats: Stat[] = [
    { label: "Radar passes", value: passes.toLocaleString(), detail: "with a usable reading" },
    {
      label: "Saw water",
      value: wet.toLocaleString(),
      detail: `${Number(((wet / passes) * 100).toFixed(1))}% of passes`,
    },
  ];
  if (hazard.last_wet)
    stats.push({ label: "Last seen", value: formatDate(hazard.last_wet) });
  return {
    stats,
    chart: (
      <FloodPassGrid
        passes={passes}
        wet={wet}
        firstWet={hazard.first_wet}
        lastWet={hazard.last_wet}
      />
    ),
    note: "Observation frequency, not future flood probability.",
  };
}

function heatContent(hazard: Hazard): PanelContent | null {
  const temperature = hazard.surface_temp_f;
  if (!available(hazard) || !finite(temperature)) return null;
  const lowland = finite(hazard.lowland_percentile);
  const percentile = lowland ? hazard.lowland_percentile : hazard.county_percentile;
  const recent = yearRange(hazard.recent_years);
  const stats: Stat[] = [
    {
      label: "Surface temp",
      value: `${temperature.toFixed(1)}°F`,
      detail: recent ? `${recent} average` : undefined,
    },
  ];
  if (finite(percentile))
    stats.push({
      label: "Percentile",
      value: ordinal(Math.round(percentile)),
      detail: `warmer than ${Math.round(percentile)}% of ${lowland ? "the lowland" : "the county"}`,
    });
  if (finite(hazard.change_since_early_f))
    stats.push({
      label: `Since ${yearRange(hazard.early_years) || "early years"}`,
      value: `${signed(hazard.change_since_early_f)}°F`,
      detail: "change relative to the lowland",
    });
  const years = (hazard.yearly_relative_f ?? []).filter((point) =>
    finite(point.relative_f),
  );
  const days = finite(hazard.clear_days_used)
    ? `Based on ${hazard.clear_days_used} clear summer days${years.length ? `, ${yearRange(years.map((point) => point.year))}` : ""}. `
    : "";
  return {
    stats,
    chart:
      years.length >= 2 ? (
        <HeatTrendChart
          points={hazard.yearly_relative_f ?? []}
          recentYears={hazard.recent_years ?? []}
        />
      ) : (
        <ChartEmpty text="Year-by-year heat isn’t available for this address." />
      ),
    note: `${days}Surface temperature is not air or indoor temperature.`,
  };
}

function groundContent(hazard: Hazard): PanelContent | null {
  const velocity = hazard.velocity_mm_per_yr;
  if (!available(hazard) || !finite(velocity)) return null;
  const series = (hazard.series_mm ?? []).filter((point): point is Reading =>
    finite(point.mm),
  );
  const stats: Stat[] = [
    {
      label: "Rate",
      value: `${Math.abs(velocity).toFixed(1)} mm/yr`,
      detail: "along the line of sight",
    },
  ];
  if (series.length >= 2)
    stats.push(
      {
        label: "Largest shift",
        value: `${Math.max(...series.map((point) => Math.abs(point.mm))).toFixed(1)} mm`,
        detail: "from the first reading",
      },
      {
        label: "Readings",
        value: String(series.length),
        detail: yearRange(series.map((point) => Number(point.date.slice(0, 4)))),
      },
    );
  return {
    stats,
    chart:
      series.length >= 2 ? (
        <GroundMotionChart series={series} />
      ) : (
        <ChartEmpty text="No movement history to draw for this address." />
      ),
    note: hazard.sign_convention_verified
      ? "Measured along the satellite’s line of sight. This doesn’t measure earthquake shaking."
      : "Measured along the satellite’s line of sight. Direction isn’t verified yet, and this doesn’t measure earthquake shaking.",
  };
}

const CONTENT: Record<HazardKind, (hazard: Hazard) => PanelContent | null> = {
  flood: floodContent,
  heat: heatContent,
  ground_motion: groundContent,
};

function Source({ hazard }: { hazard: Hazard }) {
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

function Action({ kind }: { kind: HazardKind }) {
  const meta = hazardMeta[kind];
  return (
    <div className="hfd-action">
      <span className="hfd-actionLabel">What you can do</span>
      <strong>{meta.action}</strong>
      <p>{meta.actionDetail}</p>
      {meta.href && (
        <a href={meta.href} target="_blank" rel="noreferrer">
          {meta.linkLabel}
          <ArrowUpRight size={12} />
        </a>
      )}
    </div>
  );
}

function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="hfd-chartEmpty">
      <span className="hfd-icon hfd-emptyIcon">
        <ScanLine size={20} strokeWidth={1.4} />
      </span>
      <p>{text}</p>
    </div>
  );
}

function PanelSkeleton({ title }: { title: string }) {
  return (
    <div className="hfd-panelBody hfd-skeleton">
      <span className="sr-only">Loading {title.toLowerCase()}</span>
      <div className="hfd-story" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <span className="hfd-chart" aria-hidden="true" />
    </div>
  );
}

function FloodPassGrid({
  passes,
  wet,
  firstWet,
  lastWet,
}: {
  passes: number;
  wet: number;
  firstWet?: string | null;
  lastWet?: string | null;
}) {
  const perCell = Math.max(1, Math.ceil(passes / MAX_PASS_CELLS));
  const cells = Math.ceil(passes / perCell);
  const wetCells = Math.min(cells, Math.ceil(wet / perCell));
  return (
    <figure className="hfd-figure">
      <figcaption className="hfd-chartTitle">Every usable radar pass</figcaption>
      <div className="hfd-passBody">
        <div
          className="hfd-passGrid"
          role="img"
          aria-label={`${wet} of ${passes} radar passes saw water`}
        >
          {Array.from({ length: cells }, (_, index) => (
            <span key={index} className={index < wetCells ? "hfd-wet" : "hfd-dry"} />
          ))}
        </div>
        <div className="hfd-legend">
          <span>
            <i className="hfd-wet" />
            Saw water · {wet.toLocaleString()}
          </span>
          <span>
            <i className="hfd-dry" />
            No water · {(passes - wet).toLocaleString()}
          </span>
          <span className="hfd-legendNote">
            {perCell === 1 ? "1 square = 1 pass" : `1 square = ${perCell} passes`}
          </span>
        </div>
        {firstWet && lastWet && (
          <p className="hfd-chartFoot">
            Water first seen {formatDate(firstWet)}, most recently{" "}
            {formatDate(lastWet)}.
          </p>
        )}
      </div>
    </figure>
  );
}

function HeatTrendChart({
  points,
  recentYears,
}: {
  points: YearHeat[];
  recentYears: number[];
}) {
  const color = HAZARD_STYLE.heat.color;
  const recent = new Set(recentYears);
  const data = points.map((point) => ({
    year: point.year,
    relative: point.relative_f,
  }));
  const described = data
    .flatMap((point) =>
      finite(point.relative) ? [`${point.year} ${signed(point.relative)}°F`] : [],
    )
    .join(", ");
  return (
    <figure className="hfd-figure">
      <figcaption className="hfd-chartTitle">
        Each summer vs. the lowland median
      </figcaption>
      <ChartContainer
        config={{ relative: { label: "vs. lowland median", color } }}
        className="hfd-chartBox"
        role="img"
        aria-label={`Surface heat relative to the lowland median by summer: ${described}`}
      >
        <BarChart
          data={data}
          margin={{ top: 10, right: 4, bottom: 0, left: -14 }}
          barCategoryGap="24%"
        >
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 4" />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            tickFormatter={(year: number) => `’${String(year).slice(2)}`}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            width={48}
            tickFormatter={(value: number) => `${signed(value, 0)}°`}
          />
          <ReferenceLine y={0} stroke={ZERO_STROKE} />
          <Tooltip
            cursor={{ fill: "rgb(255 255 255 / 4%)" }}
            content={
              <ChartTooltipContent
                hideIndicator
                className="hfd-tooltip"
                labelFormatter={(_, payload) =>
                  `Summer ${payload?.[0]?.payload?.year ?? ""}`
                }
                formatter={(value) => (
                  <span className="hfd-tooltipValue">
                    {signed(Number(value))}°F vs. the median
                  </span>
                )}
              />
            }
          />
          <Bar dataKey="relative" radius={3} isAnimationActive={false}>
            {data.map((point) => (
              <Cell
                key={point.year}
                fill={(point.relative ?? 0) >= 0 ? color : COOLER}
                fillOpacity={recent.has(point.year) ? 1 : 0.42}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="hfd-legend">
        <span>
          <i style={{ background: color }} />
          Warmer than the median
        </span>
        <span>
          <i style={{ background: COOLER }} />
          Cooler
        </span>
        {recentYears.length > 0 && (
          <span className="hfd-legendNote">
            Bright bars: {yearRange(recentYears)}
          </span>
        )}
      </div>
    </figure>
  );
}

function GroundMotionChart({ series }: { series: Reading[] }) {
  const color = HAZARD_STYLE.ground_motion.color;
  const fillId = `ground-${useId().replaceAll(":", "")}`;
  const data = series.map((point) => ({ time: dateValue(point.date), mm: point.mm }));
  const firstYear = new Date(data[0].time).getUTCFullYear();
  const lastYear = new Date(data[data.length - 1].time).getUTCFullYear();
  const step = lastYear - firstYear > 6 ? 2 : 1;
  const ticks: number[] = [];
  for (let year = firstYear + 1; year <= lastYear; year += step)
    ticks.push(Date.UTC(year, 0, 1));
  return (
    <figure className="hfd-figure">
      <figcaption className="hfd-chartTitle">Change since the first reading</figcaption>
      <ChartContainer
        config={{ mm: { label: "Change since first reading", color } }}
        className="hfd-chartBox"
        role="img"
        aria-label={`Ground movement history: ${series.length} readings from ${formatDate(series[0].date)} to ${formatDate(series[series.length - 1].date)}`}
      >
        <AreaChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 4" />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={ticks}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            tickFormatter={(time: number) => String(new Date(time).getUTCFullYear())}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            width={48}
            tickFormatter={(value: number) => `${value} mm`}
          />
          <ReferenceLine y={0} stroke={ZERO_STROKE} />
          <Tooltip
            cursor={{ stroke: "rgb(255 255 255 / 22%)" }}
            content={
              <ChartTooltipContent
                hideIndicator
                className="hfd-tooltip"
                labelFormatter={(_, payload) => {
                  const time = payload?.[0]?.payload?.time;
                  return finite(time) ? formatDate(time) : "";
                }}
                formatter={(value) => (
                  <span className="hfd-tooltipValue">
                    {signed(Number(value))} mm from the first reading
                  </span>
                )}
              />
            }
          />
          <Area
            type="linear"
            dataKey="mm"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${fillId})`}
            baseValue={0}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: color, stroke: "#0d0b24", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
      <div className="hfd-legend">
        <span className="hfd-legendNote">Readings are spaced to scale in time.</span>
      </div>
    </figure>
  );
}

function HazardPanel({
  kind,
  hazard,
  loading,
}: {
  kind: HazardKind;
  hazard?: Hazard;
  loading: boolean;
}) {
  const meta = hazardMeta[kind];
  const { icon: Icon, color } = HAZARD_STYLE[kind];
  const content = !loading && hazard ? CONTENT[kind](hazard) : null;
  const titleId = `hazard-${kind}-title`;
  return (
    <article
      id={`hazard-${kind}`}
      className={`hfd-panel${hasHazardSignal(hazard, kind) ? " hfd-signal" : ""}`}
      style={{ "--hz": color } as CSSProperties}
      aria-labelledby={titleId}
      aria-busy={loading}
    >
      <header className="hfd-panelHeader">
        <span className="hfd-icon">
          <Icon size={17} strokeWidth={1.7} />
        </span>
        <h3 id={titleId}>{meta.title}</h3>
        {!loading && hazard && (
          <div className="hfd-panelTools">
            <span className="hfd-status">{finding(hazard, kind).label}</span>
            <Source hazard={hazard} />
          </div>
        )}
      </header>
      {loading || !hazard ? (
        <PanelSkeleton title={meta.title} />
      ) : (
        <div className="hfd-panelBody">
          <div className="hfd-story">
            <p className="hfd-headline">{headline(hazard, kind)}</p>
            {hazard.message && <p className="hfd-message">{hazard.message}</p>}
            {content && content.stats.length > 0 && (
              <dl className="hfd-stats">
                {content.stats.map((stat) => (
                  <div key={stat.label}>
                    <dt>{stat.label}</dt>
                    <dd>{stat.value}</dd>
                    {stat.detail && <dd className="hfd-statDetail">{stat.detail}</dd>}
                  </div>
                ))}
              </dl>
            )}
            <p className="hfd-note">
              <ScanLine size={12} aria-hidden="true" />
              {content
                ? content.note
                : hazard.status === "error"
                  ? "The other observations on this page are still available."
                  : EMPTY_NOTE[kind]}
            </p>
          </div>
          <Action kind={kind} />
          <div className="hfd-chart">
            {content ? content.chart : <ChartEmpty text={EMPTY_CHART[kind]} />}
          </div>
        </div>
      )}
    </article>
  );
}

function Glance({ report, loading }: { report: Report | null; loading: boolean }) {
  return (
    <nav className="hfd-glance" aria-label="Findings at a glance">
      {hazardKinds.map((kind) => {
        const hazard = report?.hazards[kind];
        const { icon: Icon, color } = HAZARD_STYLE[kind];
        return (
          <a
            key={kind}
            href={`#hazard-${kind}`}
            className={`hfd-chip${hasHazardSignal(hazard, kind) ? " hfd-signal" : ""}`}
            style={{ "--hz": color } as CSSProperties}
          >
            <span className="hfd-icon">
              <Icon size={15} strokeWidth={1.7} />
            </span>
            <span className="hfd-chipText">
              <span className="hfd-chipLabel">{hazardMeta[kind].title}</span>
              {loading || !hazard ? (
                <span className="hfd-chipSkeleton" />
              ) : (
                <strong>{glance(hazard, kind)}</strong>
              )}
            </span>
            <ArrowDownRight className="hfd-chipArrow" size={15} aria-hidden="true" />
          </a>
        );
      })}
    </nav>
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
      <header className="hfd-heading">
        <div>
          <p className="hfd-eyebrow">
            <Satellite size={13} /> Satellite observations
          </p>
          <h2 id="dashboard-title">
            What the satellites <em>saw</em>
          </h2>
        </div>
        {report && (
          <p className="hfd-place">
            <span>{report.address}</span>
            <span>
              {Math.abs(report.lat).toFixed(4)}° {report.lat >= 0 ? "N" : "S"} ·{" "}
              {Math.abs(report.lon).toFixed(4)}° {report.lon >= 0 ? "E" : "W"}
            </span>
          </p>
        )}
      </header>
      <Glance report={report} loading={loading} />
      <div className="hfd-panels">
        {hazardKinds.map((kind) => (
          <HazardPanel
            key={kind}
            kind={kind}
            hazard={report?.hazards[kind]}
            loading={loading}
          />
        ))}
      </div>
      <p className="hfd-dashboardNote">
        <ScanLine size={13} />
        Every reading has limits. Open Source on any panel to see where it comes
        from and what it can’t tell you.
      </p>
    </section>
  );
}
