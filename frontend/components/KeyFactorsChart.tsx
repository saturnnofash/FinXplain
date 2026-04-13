"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import type { KeyFactor } from "@/types/api";

interface KeyFactorsChartProps {
  factors: KeyFactor[];
  supportBarColor?: string;
}

interface ChartItem {
  label: string;
  value: number;
  absValue: number;
  direction: string;
  impact: string;
  userValue: string | number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartItem }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#0d1525",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 12,
      }}
    >
      <p style={{ color: "#fff", fontWeight: 500 }}>{d.label}</p>
      <p style={{ color: "rgba(255,255,255,0.65)" }}>Your value: {d.userValue}</p>
      <p style={{ color: "rgba(255,255,255,0.65)" }}>
        Impact: <span style={{ textTransform: "capitalize" }}>{d.impact}</span>
      </p>
    </div>
  );
}

export default function KeyFactorsChart({
  factors,
  supportBarColor = "#5DCAA5",
}: KeyFactorsChartProps) {
  const gradId = `barGrad-${supportBarColor.replace("#", "")}`;

  const data: ChartItem[] = factors.map((f) => ({
    label: f.label,
    value: f.contribution,
    absValue: Math.abs(f.contribution),
    direction: f.direction,
    impact: f.impact,
    userValue: f.value,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.16 }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={factors.length * 52 + 16}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 60, bottom: 4, left: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={140}
            tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="absValue" radius={[0, 6, 6, 0]} barSize={20}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.direction === "supports"
                    ? `url(#${gradId})`
                    : "rgba(255,255,255,0.15)"
                }
              />
            ))}
          </Bar>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={supportBarColor} stopOpacity={0.6} />
              <stop offset="100%" stopColor={supportBarColor} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-col gap-1 -mt-1 px-1">
        {data.map((d, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span style={{ color: "rgba(255,255,255,0.45)" }}>{d.label}</span>
            <span
              style={{
                color:
                  d.direction === "supports"
                    ? supportBarColor
                    : "rgba(255,255,255,0.45)",
              }}
            >
              {d.value > 0 ? "+" : ""}
              {d.value.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
