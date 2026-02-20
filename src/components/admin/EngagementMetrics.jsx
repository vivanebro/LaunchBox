import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  Users, 
  LogIn, 
  Package, 
  Calendar, 
  TrendingUp, 
  Activity 
} from 'lucide-react';

export default function EngagementMetrics({ metrics }) {
  const kpiCards = [
    {
      title: 'Total Registered Users',
      value: metrics.totalUsers,
      percentage: 100,
      icon: Users,
      color: 'blue',
      description: 'All users who signed up'
    },
    {
      title: 'Users Who Logged In',
      value: metrics.loggedInUsers,
      percentage: metrics.loggedInPercentage,
      icon: LogIn,
      color: 'green',
      description: 'Logged in at least once'
    },
    {
      title: 'Users Who Created Packages',
      value: metrics.packageCreators,
      percentage: metrics.packageCreatorsPercentage,
      icon: Package,
      color: 'purple',
      description: 'Created at least 1 package'
    },
    {
      title: 'Multi-Day Users',
      value: metrics.multiDayUsers,
      percentage: metrics.multiDayPercentage,
      icon: Calendar,
      color: 'amber',
      description: 'Active on 3+ different days'
    },
    {
      title: 'Active Last 7 Days',
      value: metrics.active7Days,
      percentage: metrics.active7DaysPercentage,
      icon: TrendingUp,
      color: 'indigo',
      description: 'Active in last week'
    },
    {
      title: 'Active Last 30 Days',
      value: metrics.active30Days,
      percentage: metrics.active30DaysPercentage,
      icon: Activity,
      color: 'pink',
      description: 'Active in last month'
    }
  ];

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 border-blue-100',
    green: 'from-green-500 to-green-600 border-green-100',
    purple: 'from-purple-500 to-purple-600 border-purple-100',
    amber: 'from-amber-500 to-amber-600 border-amber-100',
    indigo: 'from-indigo-500 to-indigo-600 border-indigo-100',
    pink: 'from-pink-500 to-pink-600 border-pink-100'
  };

  return (
    <>
      {kpiCards.map((kpi, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className={`bg-white shadow-lg border-2 ${colorClasses[kpi.color].split(' ')[1]} hover:shadow-xl transition-all`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{kpi.title}</CardTitle>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[kpi.color].split(' ')[0]} ${colorClasses[kpi.color].split(' ')[1].replace('border', 'from')} flex items-center justify-center shadow-md`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-gray-900">{kpi.value}</div>
                <div className="text-lg font-semibold text-gray-500">
                  ({kpi.percentage}%)
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </>
  );
}