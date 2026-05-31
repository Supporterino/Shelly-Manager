/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const id = "@ctx/sidebar-dashboard";
const SIDEBAR_ORDER = 140;
const REFRESH_INTERVAL_MS = 15000;
const REPO_ROOT = "/Users/supporterino/WebstormProjects/Shelly-Manager";
const CTX_BIN = "/opt/homebrew/bin/ctx";
const execFileAsync = promisify(execFile);

type Dashboard = any;
type Line = { text: string; fg?: string; bold?: boolean };
const CTX_RED = "#ff375f";
const CTX_BLUE = "#4da3ff";

function shorten(value: string | null | undefined, limit = 28) {
  if (!value) return "none";
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1)}…`;
}

function formatTokens(value: number | null | undefined) {
  return `${Number(value || 0).toLocaleString("en-US")} tok`;
}

function formatPct(value: number | null | undefined) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function metric(label: string, value: string, fg?: string): Line {
  return { text: `${label.padEnd(10)} ${value}`, fg };
}

async function loadDashboard() {
  const { stdout } = await execFileAsync(
    CTX_BIN,
    ["--json", "--repo-root", REPO_ROOT, "host-dashboard"],
    {
      cwd: REPO_ROOT,
      maxBuffer: 1024 * 1024,
    },
  );
  return JSON.parse(stdout || "{}");
}

function buildLines(dashboard: Dashboard): Line[] {
  const savings = dashboard?.savings || {};
  const cache = dashboard?.cache || {};
  const index = cache.index || {};
  const read = cache.read || {};
  const topWins = dashboard?.top_wins || {};
  const bestQuery = topWins.best_query || {};
  const latestPack = dashboard?.latest_activity?.latest_pack_path?.split("/").pop() || "none";

  return [
    { text: "CTX Dashboard", fg: CTX_RED, bold: true },
    { text: `${dashboard?.repo || "repo"}`, fg: CTX_BLUE },
    { text: "" },
    { text: "Savings", fg: CTX_RED, bold: true },
    metric("Saved", formatTokens(savings.estimated_tokens_saved)),
    metric("Avg/run", formatTokens(savings.average_tokens_saved_per_run)),
    metric("Avg red", formatPct(savings.average_reduction_pct)),
    metric("Latest", formatPct(savings.latest_reduction_pct)),
    metric("Runs", String(savings.sampled_runs || 0)),
    { text: "" },
    { text: "Cache", fg: CTX_RED, bold: true },
    metric("Read hit", formatPct(read.hit_rate_pct)),
    metric("Idx reuse", formatPct(index.reuse_ratio_pct)),
    metric("Reads", String(read.total_reads || 0)),
    metric("Tracked", String(read.tracked_files || 0)),
    { text: "" },
    { text: "Top Win", fg: CTX_RED, bold: true },
    { text: shorten(bestQuery.query || "none"), fg: CTX_BLUE },
    metric("Saved", formatTokens(bestQuery.estimated_tokens_saved)),
    metric("Runs", String(bestQuery.runs || 0)),
    metric("Avg red", formatPct(bestQuery.average_reduction_pct)),
    { text: "" },
    { text: "Artifact", fg: CTX_RED, bold: true },
    { text: shorten(latestPack, 34), fg: CTX_BLUE },
  ];
}

function colorFor(line: Line) {
  return line.fg || CTX_BLUE;
}

function SidebarContentView(props: { api: TuiPluginApi; sessionID: string }) {
  const [lines, setLines] = createSignal<Line[]>([
    { text: "CTX Dashboard", fg: CTX_RED, bold: true },
    { text: "Loading dashboard…", fg: CTX_BLUE },
  ]);

  let disposed = false;
  let loadVersion = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const reload = () => {
    const currentVersion = ++loadVersion;
    void loadDashboard()
      .then((dashboard) => {
        if (disposed || currentVersion !== loadVersion) return;
        setLines(buildLines(dashboard));
      })
      .catch((error) => {
        if (disposed || currentVersion !== loadVersion) return;
        setLines([
          { text: "CTX Dashboard", fg: CTX_RED, bold: true },
          { text: "Dashboard unavailable", fg: CTX_RED },
          { text: shorten(String(error?.message || error), 30), fg: CTX_BLUE },
        ]);
      });
  };

  const queueRefresh = (delay: number) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      reload();
    }, delay);
    timers.add(timer);
  };

  const scheduleRefresh = () => {
    queueRefresh(150);
    queueRefresh(750);
  };

  createEffect(() => {
    props.sessionID;
    reload();
    queueRefresh(600);
    queueRefresh(1800);
  });

  const interval = setInterval(reload, REFRESH_INTERVAL_MS);
  const unsubscribers = [
    props.api.event.on("session.updated", (event) => {
      if (event.properties?.info?.id === props.sessionID) scheduleRefresh();
    }),
    props.api.event.on("message.updated", (event) => {
      if (event.properties?.info?.sessionID === props.sessionID) scheduleRefresh();
    }),
    props.api.event.on("message.removed", (event) => {
      if (event.properties?.sessionID === props.sessionID) scheduleRefresh();
    }),
    props.api.event.on("tui.session.select", (event) => {
      if (event.properties?.sessionID === props.sessionID) scheduleRefresh();
    }),
  ];

  onCleanup(() => {
    disposed = true;
    clearInterval(interval);
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    for (const unsubscribe of unsubscribers) unsubscribe();
  });

  return (
    <box gap={0}>
      {lines().map((line) => (
        <text fg={colorFor(line)} wrapMode="none">
          {line.bold ? <b>{line.text || " "}</b> : line.text || " "}
        </text>
      ))}
    </box>
  );
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: SIDEBAR_ORDER,
    slots: {
      sidebar_content(_ctx, props: { session_id: string }) {
        return <SidebarContentView api={api} sessionID={props.session_id} />;
      },
    },
  });
};

const pluginModule: TuiPluginModule & { id: string } = {
  id,
  tui,
};

export default pluginModule;
