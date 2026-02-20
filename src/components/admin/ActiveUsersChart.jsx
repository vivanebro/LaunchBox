import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function ActiveUsersChart({ chartData }) {
  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Active Users Trend (Last 30 Days)
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Users who performed meaningful actions each day
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280" 
              style={{ fontSize: '11px' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6B7280" 
              style={{ fontSize: '12px' }}
              label={{ value: 'Active Users', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#FFF', 
                border: '1px solid #E5E7EB', 
                borderRadius: '8px' 
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="activeUsers" 
              stroke="#6366F1" 
              strokeWidth={2} 
              dot={{ fill: '#6366F1', r: 4 }}
              name="Active Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}