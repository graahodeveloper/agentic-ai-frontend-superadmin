import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from "recharts";

interface DailyActivityChartProps {
  chartData: {
    date: string;
    day: number;
    month: string;
    count: number;
    displayLabel: string;
  }[];
}

const DailyActivityChart: React.FC<DailyActivityChartProps> = ({ chartData }) => {
  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-md">
      <h4 className="text-xl font-bold text-gray-800 mb-6">Daily Conversation Activity</h4>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="displayLabel"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              allowDecimals={false}
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                borderRadius: "8px",
                color: "white",
                border: "none",
              }}
              formatter={(value: number) => [`${value} messages`, "Messages"]}
            />
            <Bar
              dataKey="count"
              fill="url(#colorUv)"
              radius={[6, 6, 0, 0]}
              barSize={32}
            >
              <LabelList
                dataKey="count"
                position="top"
                style={{ fill: "#374151", fontSize: 12 }}
              />
            </Bar>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.9} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {chartData.length > 15 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Showing last {chartData.length} days of activity
        </div>
      )}
    </div>
  );
};

export default DailyActivityChart;
