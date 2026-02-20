import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function RetentionHeatmap({ cohorts }) {
  const getHeatmapColor = (percentage) => {
    if (percentage >= 70) return 'bg-green-500 text-white';
    if (percentage >= 50) return 'bg-green-400 text-gray-900';
    if (percentage >= 30) return 'bg-yellow-400 text-gray-900';
    if (percentage >= 15) return 'bg-orange-400 text-gray-900';
    if (percentage > 0) return 'bg-red-400 text-white';
    return 'bg-gray-200 text-gray-400';
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Cohort Retention Analysis
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Percentage of users from each signup week who remained active
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-700 sticky left-0 bg-white z-10">
                  Cohort
                </th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Users</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">Day 1</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">Day 3</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">Day 7</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">Day 14</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">Day 30</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium text-gray-900 sticky left-0 bg-white">
                    {cohort.week}
                  </td>
                  <td className="py-3 px-2 text-gray-700">{cohort.totalUsers}</td>
                  <td className="py-3 px-2">
                    <div className={`text-center py-1 px-2 rounded font-semibold ${getHeatmapColor(cohort.day1)}`}>
                      {cohort.day1}%
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className={`text-center py-1 px-2 rounded font-semibold ${getHeatmapColor(cohort.day3)}`}>
                      {cohort.day3}%
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className={`text-center py-1 px-2 rounded font-semibold ${getHeatmapColor(cohort.day7)}`}>
                      {cohort.day7}%
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className={`text-center py-1 px-2 rounded font-semibold ${getHeatmapColor(cohort.day14)}`}>
                      {cohort.day14}%
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className={`text-center py-1 px-2 rounded font-semibold ${getHeatmapColor(cohort.day30)}`}>
                      {cohort.day30}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            Excellent (70%+)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-400"></div>
            Good (30-69%)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-400"></div>
            Needs Attention (&lt;30%)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}