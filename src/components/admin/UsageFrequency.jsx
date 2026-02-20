import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function UsageFrequency({ frequencyData }) {
  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'];

  const data = [
    { range: '1 day only', users: frequencyData.onceOnly, percentage: frequencyData.onceOnlyPercentage },
    { range: '2-3 days', users: frequencyData.days2to3, percentage: frequencyData.days2to3Percentage },
    { range: '4-7 days', users: frequencyData.days4to7, percentage: frequencyData.days4to7Percentage },
    { range: '8+ days', users: frequencyData.days8Plus, percentage: frequencyData.days8PlusPercentage }
  ];

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Usage Frequency (Last 30 Days)
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Distribution of how many days users engaged with the product
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="range" 
              stroke="#6B7280" 
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6B7280" 
              style={{ fontSize: '12px' }}
              label={{ value: 'Users', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#FFF', 
                border: '1px solid #E5E7EB', 
                borderRadius: '8px' 
              }}
              formatter={(value, name, props) => [
                `${value} users (${props.payload.percentage}%)`,
                'Count'
              ]}
            />
            <Bar dataKey="users" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              <div 
                className="w-4 h-4 rounded mx-auto mb-1" 
                style={{ backgroundColor: COLORS[index] }}
              ></div>
              <div className="text-sm font-semibold text-gray-900">{item.percentage}%</div>
              <div className="text-xs text-gray-600">{item.range}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}