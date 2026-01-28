"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * OKX 公共 WebSocket 地址（生产环境）
 * 参考 OKX 官方说明。wss://ws.okx.com:8443/ws/v5/public citeturn0search0
 */
const OKX_WS_PUBLIC = "wss://ws.okx.com:8443/ws/v5/public";

/**
 * REST 基础地址：用 okx.com（跨区域一般可用）
 * 如果你在 EEA/特定区域，也可以换成 app.okx.com 或 eea.okx.com 等。
 */
const OKX_REST = "https://www.okx.com";

type Ticker = {
  instId: string;
  last: number;
  sodUtc0?: number; // 24h open-ish (not always present)
  open24h?: number;
  high24h?: number;
  low24h?: number;
  volCcy24h?: number;
  vol24h?: number;
  ts?: number;
};

type Row = {
  instId: string;
  symbol: string;
  last: number;
  change24hPct: number | null;
  volUsd24h: number | null;
  rsi14D: number | null;
  change4hPct: number | null;
  rsiUpdatedAt: number | null;
};

type RsiCacheEntry = {
  rsi14D: number | null;
  change4hPct: number | null;
  rsiUpdatedAt: number;
};

function fmtNum(n: number | null, digits = 2) {
  if (n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
function fmtPct(n: number | null, digits = 2) {
  if (n === null || Number.isNaN(n)) return "—";
  const s = (n * 100).toFixed(digits) + "%";
  return s;
}
function clsPct(n: number | null) {
  if (n === null || Number.isNaN(n)) return "muted";
  if (n > 0) return "good";
  if (n < 0) return "bad";
  return "muted";
}

function instIdToSymbol(instId: string) {
  // OKX SWAP 示例：BTC-USDT-SWAP -> BTC
  return instId.split("-")[0] ?? instId;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 带指数退避的 fetch（用于被 50011/429 限流时稍微缓一缓）
 * OKX 文档：触发限流会返回 50011。citeturn0search11
 */
async function fetchWithBackoff(url: string, tries = 4): Promise<Response> {
  let wait = 400;
  let lastErr: unknown = null;

  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return res;

      // 某些环境会用 429；OKX 也常用 code 50011（在 body）
      if (res.status === 429 || res.status === 418 || res.status === 503) {
        await sleep(wait);
        wait = Math.min(wait * 2, 4000);
        continue;
      }

      // 尝试读 body code
      const txt = await res.clone().text();
      if (txt.includes("50011") || txt.includes("Rate limit")) {
        await sleep(wait);
        wait = Math.min(wait * 2, 4000);
        continue;
      }

      return res;
    } catch (e) {
      lastErr = e;
      await sleep(wait);
      wait = Math.min(wait * 2, 4000);
    }
  }

  throw lastErr ?? new Error("fetch failed");
}

async function fetchCandles(instId: string, bar: string, limit: number) {
  const url = `${OKX_REST}/api/v5/market/candles?instId=${encodeURIComponent(instId)}&bar=${encodeURIComponent(
    bar
  )}&limit=${limit}`;
  const res = await fetchWithBackoff(url);
  const json = await res.json();
  // OKX: { code, data: [[ts, o, h, l, c, vol, volCcy, ...], ...] }
  return json as { code: string; msg?: string; data: string[][] };
}

/**
 * RSI(14) 经典算法（使用收盘价序列）
 */
function calcRsi14(closes: number[]) {
  if (closes.length < 15) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= 14; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += -diff;
  }

  let avgGain = gains / 14;
  let avgLoss = losses / 14;

  for (let i = 15; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * 13 + gain) / 14;
    avgLoss = (avgLoss * 13 + loss) / 14;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function loadRsiCache(instId: string): RsiCacheEntry | null {
  try {
    const raw = localStorage.getItem(`rsi_cache_v1:${instId}`);
    if (!raw) return null;
    return JSON.parse(raw) as RsiCacheEntry;
  } catch {
    return null;
  }
}
function saveRsiCache(instId: string, entry: RsiCacheEntry) {
  try {
    localStorage.setItem(`rsi_cache_v1:${instId}`, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

function nowMs() {
  return Date.now();
}

export default function Page() {
  const [wsStatus, setWsStatus] = useState<"connecting" | "open" | "closed" | "error">("connecting");
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"vol" | "chg" | "rsi">("vol");
  const [topN, setTopN] = useState(50);

  // RSI job mutex（防止并发叠加）
  const rsiRunningRef = useRef(false);
  const rsiAbortRef = useRef(false);

  // WS 连接
  useEffect(() => {
    let ws: WebSocket | null = null;
    let alive = true;

    const connect = () => {
      setWsStatus("connecting");
      ws = new WebSocket(OKX_WS_PUBLIC);

      ws.onopen = () => {
        if (!alive) return;
        setWsStatus("open");
        // 订阅 SWAP tickers（所有 SWAP）
        // OKX WS: { op:"subscribe", args:[{channel:"tickers", instType:"SWAP"}] }
        ws!.send(JSON.stringify({ op: "subscribe", args: [{ channel: "tickers", instType: "SWAP" }] }));
      };

      ws.onmessage = (ev) => {
        if (!alive) return;
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.event) return; // subscribe / error events
          if (!msg?.arg || !msg?.data) return;
          if (msg.arg.channel !== "tickers") return;

          const data = msg.data as any[];
          if (!Array.isArray(data)) return;

          setTickers((prev) => {
            const next = { ...prev };
            for (const t of data) {
              const instId = String(t.instId);
              const last = Number(t.last);
              // OKX tickers fields vary; keep a few
              const open24h = t.open24h != null ? Number(t.open24h) : null;
              const volCcy24h = t.volCcy24h != null ? Number(t.volCcy24h) : null;
              const ts = t.ts != null ? Number(t.ts) : nowMs();

              next[instId] = {
                instId,
                last,
                open24h: open24h ?? undefined,
                volCcy24h: volCcy24h ?? undefined,
                ts,
              };
            }
            return next;
          });
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        if (!alive) return;
        setWsStatus("error");
      };

      ws.onclose = () => {
        if (!alive) return;
        setWsStatus("closed");
        // 自动重连（指数退避不做太复杂）
        setTimeout(() => {
          if (alive) connect();
        }, 1200);
      };
    };

    connect();

    return () => {
      alive = false;
      try {
        ws?.close();
      } catch {}
    };
  }, []);

  const rows: Row[] = useMemo(() => {
    const list: Row[] = Object.values(tickers).map((t) => {
      const symbol = instIdToSymbol(t.instId);
      const change24hPct =
        t.open24h && t.open24h > 0 && t.last > 0 ? (t.last - t.open24h) / t.open24h : null;
      // 粗略：volCcy24h 对 USDT swap 常≈ quote volume（单位 USDT）
      const volUsd24h = t.volCcy24h != null ? t.volCcy24h : null;

      // RSI 从缓存加载
      const cache = typeof window !== "undefined" ? loadRsiCache(t.instId) : null;

      return {
        instId: t.instId,
        symbol,
        last: t.last,
        change24hPct,
        volUsd24h,
        rsi14D: cache?.rsi14D ?? null,
        change4hPct: cache?.change4hPct ?? null,
        rsiUpdatedAt: cache?.rsiUpdatedAt ?? null,
      };
    });

    const q = search.trim().toUpperCase();
    const filtered = q ? list.filter((r) => r.symbol.toUpperCase().includes(q) || r.instId.includes(q)) : list;

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "vol") return (b.volUsd24h ?? -1) - (a.volUsd24h ?? -1);
      if (sortKey === "chg") return (b.change24hPct ?? -999) - (a.change24hPct ?? -999);
      // rsi: 从高到低
      return (b.rsi14D ?? -1) - (a.rsi14D ?? -1);
    });

    return sorted;
  }, [tickers, search, sortKey]);

  // 只优先算前 N 个（降低 candles 请求量）
  const priorityInstIds = useMemo(() => rows.slice(0, topN).map((r) => r.instId), [rows, topN]);

  // RSI 独立低频刷新：默认 15 分钟一次（你也可以改成 30 分钟）
  // 日线 RSI 本质上更适合更低频刷新
  useEffect(() => {
    rsiAbortRef.current = false;

    const run = async () => {
      if (rsiRunningRef.current) return;
      rsiRunningRef.current = true;

      try {
        const TTL = 15 * 60 * 1000; // 15min cache ttl
        for (let i = 0; i < priorityInstIds.length; i++) {
          if (rsiAbortRef.current) break;
          const instId = priorityInstIds[i];
          const cached = loadRsiCache(instId);
          const fresh = cached && nowMs() - cached.rsiUpdatedAt < TTL;

          if (fresh) continue;

          // 每个 instId：日线 candles（算 RSI） + 4H candles（算 4H change）
          // 注意：candles 端点有频率限制，必须节制。citeturn0search11
          try {
            const daily = await fetchCandles(instId, "1D", 60);
            const dailyCloses = (daily.data ?? [])
              .map((c) => Number(c?.[4])) // close index 4
              .filter((x) => Number.isFinite(x))
              .reverse(); // OKX 返回倒序，reverse 变正序

            const rsi14D = calcRsi14(dailyCloses);

            // 4H change（最近 2 根 4H）
            const h4 = await fetchCandles(instId, "4H", 2);
            const c0 = h4.data?.[1]?.[4]; // older close after reverse? easier: parse both and compute
            const c1 = h4.data?.[0]?.[4];
            let change4hPct: number | null = null;
            if (c0 != null && c1 != null) {
              const older = Number(c0);
              const newer = Number(c1);
              if (Number.isFinite(older) && Number.isFinite(newer) && older > 0) {
                change4hPct = (newer - older) / older;
              }
            }

            const entry: RsiCacheEntry = {
              rsi14D: rsi14D != null ? Number(rsi14D.toFixed(2)) : null,
              change4hPct: change4hPct != null ? Number(change4hPct.toFixed(4)) : null,
              rsiUpdatedAt: nowMs(),
            };
            saveRsiCache(instId, entry);

            // 轻微节流：每个币之间等一下，避免瞬间爆发
            await sleep(180);
          } catch {
            // 被限流/网络问题：再稍微等一下继续
            await sleep(600);
          }
        }
      } finally {
        rsiRunningRef.current = false;
        // 触发 UI 重新渲染（让缓存刷新到表格上）
        setTickers((prev) => ({ ...prev }));
      }
    };

    // 首次：延迟 2 秒，先让 WS 填一点数据
    const t0 = setTimeout(run, 2000);

    // 后续：固定间隔刷新（互斥锁会阻止并发叠加）
    const interval = setInterval(run, 15 * 60 * 1000);

    return () => {
      rsiAbortRef.current = true;
      clearTimeout(t0);
      clearInterval(interval);
    };
  }, [priorityInstIds]);

  const statusPill = useMemo(() => {
    const map: Record<typeof wsStatus, { text: string; cls: string }> = {
      connecting: { text: "WS 连接中", cls: "warn" },
      open: { text: "WS 已连接", cls: "ok" },
      closed: { text: "WS 已断开", cls: "err" },
      error: { text: "WS 错误", cls: "err" },
    };
    const it = map[wsStatus];
    return (
      <span className="pill">
        <span className={`dot ${it.cls}`} />
        <span className="small muted">{it.text}</span>
      </span>
    );
  }, [wsStatus]);

  return (
    <div className="container">
      <div className="header">
        <div className="title">
          <div className="h1">OKX Perp Board（Next.js）</div>
          <div className="sub">
            行情：WebSocket tickers；RSI：独立低频刷新 + 互斥锁 + 只优先算前 {topN} 个（显著降低触发 50011 的概率）
          </div>
        </div>

        <div className="controls">
          {statusPill}
          <input
            className="input"
            placeholder="搜索：BTC / SOL / ... "
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select" value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
            <option value="vol">按 24h 成交额</option>
            <option value="chg">按 24h 涨跌幅</option>
            <option value="rsi">按 RSI(14D)</option>
          </select>
          <select className="select" value={topN} onChange={(e) => setTopN(Number(e.target.value))}>
            <option value={25}>优先算前 25</option>
            <option value={50}>优先算前 50</option>
            <option value={100}>优先算前 100</option>
          </select>
          <button
            className="button"
            onClick={() => {
              // 手动触发：清缓存后下一轮会重新计算
              for (const id of priorityInstIds) {
                localStorage.removeItem(`rsi_cache_v1:${id}`);
              }
              setTickers((prev) => ({ ...prev }));
            }}
            title="清除当前 TopN 的 RSI 缓存，让它尽快重新计算"
          >
            清 RSI 缓存（TopN）
          </button>
        </div>
      </div>

      <div className="card">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>币种</th>
                <th>合约</th>
                <th className="right">最新</th>
                <th className="right">24H%</th>
                <th className="right">4H%</th>
                <th className="right">RSI(14D)</th>
                <th className="right">24H 成交额(≈USDT)</th>
                <th className="right">RSI 更新时间</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 500).map((r) => {
                const updated = r.rsiUpdatedAt ? new Date(r.rsiUpdatedAt).toLocaleString() : "—";
                return (
                  <tr key={r.instId}>
                    <td className="mono">{r.symbol}</td>
                    <td className="mono muted">{r.instId}</td>
                    <td className="right mono">{fmtNum(r.last, 4)}</td>
                    <td className={`right mono ${clsPct(r.change24hPct)}`}>{fmtPct(r.change24hPct, 2)}</td>
                    <td className={`right mono ${clsPct(r.change4hPct)}`}>{fmtPct(r.change4hPct, 2)}</td>
                    <td className="right mono">{r.rsi14D != null ? r.rsi14D.toFixed(2) : "—"}</td>
                    <td className="right mono">{fmtNum(r.volUsd24h, 0)}</td>
                    <td className="right mono muted">{updated}</td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted">
                    没有数据（WS 未连接或被网络拦截）。如果你在国内网络环境，可能需要代理。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="footerNote">
        <div className="badge">重要</div>
        <div style={{ marginTop: 8 }}>
          1) 你之前会触发限流，核心原因是“每 10 秒刷新一次 + 每次都启动 RSI 轮询”，导致 RSI
          计算并发叠加。现在通过 <b>互斥锁</b> 保证同一时间只跑一轮，并且 <b>只优先算前 N 个</b>。<br />
          2) OKX REST /market/candles 等端点有速率限制；触发时常见报错码是 <span className="mono">50011</span>。citeturn0search11
        </div>
      </div>
    </div>
  );
}
