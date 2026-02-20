import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { Users, Package, LayoutTemplate, TrendingUp, Clock, Shield, Loader2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import RetentionHeatmap from '@/components/admin/RetentionHeatmap';
import EngagementMetrics from '@/components/admin/EngagementMetrics';
import UsageFrequency from '@/components/admin/UsageFrequency';
import ActiveUsersChart from '@/components/admin/ActiveUsersChart';

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPackages: 0,
    templatesUsed: 0,
    customPackages: 0,
    recentUsers: [],
    topUsers: [],
    packagesOverTime: [],
    userGrowth: []
  });

  const [retentionStats, setRetentionStats] = useState({
    cohorts: [],
    engagementMetrics: {
      totalUsers: 0,
      loggedInUsers: 0,
      loggedInPercentage: 0,
      packageCreators: 0,
      packageCreatorsPercentage: 0,
      multiDayUsers: 0,
      multiDayPercentage: 0,
      active7Days: 0,
      active7DaysPercentage: 0,
      active30Days: 0,
      active30DaysPercentage: 0
    },
    usageFrequency: {
      onceOnly: 0,
      onceOnlyPercentage: 0,
      days2to3: 0,
      days2to3Percentage: 0,
      days4to7: 0,
      days4to7Percentage: 0,
      days8Plus: 0,
      days8PlusPercentage: 0
    },
    activeUsersTrend: []
  });

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      if (user.role !== 'admin') {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await Promise.all([loadAdminStats(), loadRetentionStats()]);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
    setLoading(false);
  };

  const loadAdminStats = async () => {
    try {
      // Get all users
      const users = await base44.entities.User.list();
      
      // Get all packages
      const packages = await base44.entities.PackageConfig.list('-created_date');

      // Calculate stats
      const totalUsers = users.length;
      const totalPackages = packages.length;
      const templatesUsed = packages.filter(p => p.from_template === true).length;
      const customPackages = totalPackages - templatesUsed;

      // Get recent users (last 5)
      const recentUsers = users.slice(0, 5).map(u => ({
        name: u.full_name || 'Anonymous',
        email: u.email,
        joined: new Date(u.created_date).toLocaleDateString()
      }));

      // Top users by package count
      const userPackageCount = {};
      packages.forEach(pkg => {
        const email = pkg.created_by;
        userPackageCount[email] = (userPackageCount[email] || 0) + 1;
      });

      const topUsers = Object.entries(userPackageCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([email, count]) => {
          const user = users.find(u => u.email === email);
          return {
            name: user?.full_name || email,
            email: email,
            packages: count
          };
        });

      // Packages over time (last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = packages.filter(p => {
          const pkgDate = new Date(p.created_date).toISOString().split('T')[0];
          return pkgDate === dateStr;
        }).length;

        last7Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          packages: count
        });
      }

      // User growth (last 7 days)
      const userGrowth = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = users.filter(u => {
          const userDate = new Date(u.created_date).toISOString().split('T')[0];
          return userDate === dateStr;
        }).length;

        userGrowth.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          users: count
        });
      }

      setStats({
        totalUsers,
        totalPackages,
        templatesUsed,
        customPackages,
        recentUsers,
        topUsers,
        packagesOverTime: last7Days,
        userGrowth
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  };

  const loadRetentionStats = async () => {
    try {
      const users = await base44.entities.User.list();
      const packages = await base44.entities.PackageConfig.list();

      // Calculate cohorts
      const cohorts = calculateCohorts(users, packages);

      // Calculate engagement metrics
      const packageCreatorEmails = new Set(packages.map(p => p.created_by));
      const loggedInUsers = users.length; // All registered users have logged in at least once

      // Calculate multi-day users (active on 3+ different days)
      const userActivityDays = {};
      packages.forEach(pkg => {
        const email = pkg.created_by;
        const date = new Date(pkg.created_date).toISOString().split('T')[0];
        if (!userActivityDays[email]) {
          userActivityDays[email] = new Set();
        }
        userActivityDays[email].add(date);
      });

      const multiDayUsers = Object.values(userActivityDays).filter(
        days => days.size >= 3
      ).length;

      // Calculate active users in last 7 and 30 days
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const active7DaysEmails = new Set(
        packages
          .filter(p => new Date(p.created_date) >= last7Days)
          .map(p => p.created_by)
      );

      const active30DaysEmails = new Set(
        packages
          .filter(p => new Date(p.created_date) >= last30Days)
          .map(p => p.created_by)
      );

      const totalUsers = users.length;

      const engagementMetrics = {
        totalUsers,
        loggedInUsers,
        loggedInPercentage: totalUsers > 0 ? Math.round((loggedInUsers / totalUsers) * 100) : 0,
        packageCreators: packageCreatorEmails.size,
        packageCreatorsPercentage: totalUsers > 0 ? Math.round((packageCreatorEmails.size / totalUsers) * 100) : 0,
        multiDayUsers,
        multiDayPercentage: totalUsers > 0 ? Math.round((multiDayUsers / totalUsers) * 100) : 0,
        active7Days: active7DaysEmails.size,
        active7DaysPercentage: totalUsers > 0 ? Math.round((active7DaysEmails.size / totalUsers) * 100) : 0,
        active30Days: active30DaysEmails.size,
        active30DaysPercentage: totalUsers > 0 ? Math.round((active30DaysEmails.size / totalUsers) * 100) : 0
      };

      // Calculate usage frequency (last 30 days)
      const usageFrequency = calculateUsageFrequency(userActivityDays, last30Days, totalUsers);

      // Calculate active users trend
      const activeUsersTrend = calculateActiveUsersTrend(packages);

      setRetentionStats({
        cohorts,
        engagementMetrics,
        usageFrequency,
        activeUsersTrend
      });
    } catch (error) {
      console.error('Error loading retention stats:', error);
    }
  };

  const calculateCohorts = (users, packages) => {
    const cohortMap = {};
    
    users.forEach(user => {
      const signupDate = new Date(user.created_date);
      const weekStart = getWeekStart(signupDate);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!cohortMap[weekKey]) {
        cohortMap[weekKey] = {
          week: formatWeekLabel(weekStart),
          weekStart: weekStart,
          totalUsers: 0,
          activeOnDay: { 1: new Set(), 3: new Set(), 7: new Set(), 14: new Set(), 30: new Set() }
        };
      }
      
      cohortMap[weekKey].totalUsers++;
      
      // Check activity on various days
      const userPackages = packages.filter(p => p.created_by === user.email);
      
      [1, 3, 7, 14, 30].forEach(day => {
        const targetDate = new Date(signupDate.getTime() + day * 24 * 60 * 60 * 1000);
        const hasActivity = userPackages.some(pkg => {
          const pkgDate = new Date(pkg.created_date);
          return pkgDate.toISOString().split('T')[0] === targetDate.toISOString().split('T')[0];
        });
        
        if (hasActivity) {
          cohortMap[weekKey].activeOnDay[day].add(user.email);
        }
      });
    });

    return Object.values(cohortMap)
      .sort((a, b) => b.weekStart - a.weekStart)
      .slice(0, 8)
      .map(cohort => ({
        week: cohort.week,
        totalUsers: cohort.totalUsers,
        day1: cohort.totalUsers > 0 ? Math.round((cohort.activeOnDay[1].size / cohort.totalUsers) * 100) : 0,
        day3: cohort.totalUsers > 0 ? Math.round((cohort.activeOnDay[3].size / cohort.totalUsers) * 100) : 0,
        day7: cohort.totalUsers > 0 ? Math.round((cohort.activeOnDay[7].size / cohort.totalUsers) * 100) : 0,
        day14: cohort.totalUsers > 0 ? Math.round((cohort.activeOnDay[14].size / cohort.totalUsers) * 100) : 0,
        day30: cohort.totalUsers > 0 ? Math.round((cohort.activeOnDay[30].size / cohort.totalUsers) * 100) : 0
      }));
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const formatWeekLabel = (date) => {
    const endDate = new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000);
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const calculateUsageFrequency = (userActivityDays, last30Days, totalUsers) => {
    const frequencyBuckets = { onceOnly: 0, days2to3: 0, days4to7: 0, days8Plus: 0 };

    Object.entries(userActivityDays).forEach(([email, daysSet]) => {
      const recentDays = Array.from(daysSet).filter(
        dateStr => new Date(dateStr) >= last30Days
      );
      
      const dayCount = recentDays.length;
      
      if (dayCount === 1) frequencyBuckets.onceOnly++;
      else if (dayCount >= 2 && dayCount <= 3) frequencyBuckets.days2to3++;
      else if (dayCount >= 4 && dayCount <= 7) frequencyBuckets.days4to7++;
      else if (dayCount >= 8) frequencyBuckets.days8Plus++;
    });

    return {
      onceOnly: frequencyBuckets.onceOnly,
      onceOnlyPercentage: totalUsers > 0 ? Math.round((frequencyBuckets.onceOnly / totalUsers) * 100) : 0,
      days2to3: frequencyBuckets.days2to3,
      days2to3Percentage: totalUsers > 0 ? Math.round((frequencyBuckets.days2to3 / totalUsers) * 100) : 0,
      days4to7: frequencyBuckets.days4to7,
      days4to7Percentage: totalUsers > 0 ? Math.round((frequencyBuckets.days4to7 / totalUsers) * 100) : 0,
      days8Plus: frequencyBuckets.days8Plus,
      days8PlusPercentage: totalUsers > 0 ? Math.round((frequencyBuckets.days8Plus / totalUsers) * 100) : 0
    };
  };

  const calculateActiveUsersTrend = (packages) => {
    const last30Days = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const activeUsersOnDay = new Set(
        packages
          .filter(p => new Date(p.created_date).toISOString().split('T')[0] === dateStr)
          .map(p => p.created_by)
      );
      
      last30Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        activeUsers: activeUsersOnDay.size
      });
    }
    
    return last30Days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#B8D4E6' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#B8D4E6' }}>
        <div className="text-center">
          <div className="inline-block bg-white/80 rounded-3xl p-12 border-2 border-red-200 shadow-lg">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You don't have permission to access the admin dashboard.
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const packageTypeData = [
    { name: 'From Templates', value: stats.templatesUsed, color: '#3B82F6' },
    { name: 'Custom Built', value: stats.customPackages, color: '#10B981' }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#B8D4E6' }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Overview of platform activity and user statistics</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/80 shadow-md">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="retention" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Retention & Engagement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-12">{/* Keep existing overview content */}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white shadow-lg border-2 border-blue-100 hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                <Users className="w-5 h-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
                <p className="text-xs text-gray-500 mt-1">Registered accounts</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white shadow-lg border-2 border-green-100 hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Packages</CardTitle>
                <Package className="w-5 h-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalPackages}</div>
                <p className="text-xs text-gray-500 mt-1">Packages created</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white shadow-lg border-2 border-purple-100 hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Templates Used</CardTitle>
                <LayoutTemplate className="w-5 h-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.templatesUsed}</div>
                <p className="text-xs text-gray-500 mt-1">From templates</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white shadow-lg border-2 border-amber-100 hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Custom Packages</CardTitle>
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.customPackages}</div>
                <p className="text-xs text-gray-500 mt-1">Built from scratch</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Packages Over Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Packages Created (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.packagesOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="packages" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* User Growth */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  New Users (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    />
                    <Bar dataKey="users" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Package Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Package Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={packageTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {packageTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  Most Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{user.packages}</p>
                        <p className="text-xs text-gray-500">packages</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Recent Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((user, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-900">{user.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{user.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
          </TabsContent>

          <TabsContent value="retention" className="space-y-8">
            {/* Engagement KPIs */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Core Activation Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EngagementMetrics metrics={retentionStats.engagementMetrics} />
              </div>
            </div>

            {/* Cohort Retention */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Cohort Retention</h2>
              <RetentionHeatmap cohorts={retentionStats.cohorts} />
            </div>

            {/* Usage Frequency & Active Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UsageFrequency frequencyData={retentionStats.usageFrequency} />
              <ActiveUsersChart chartData={retentionStats.activeUsersTrend} />
            </div>

            {/* Traffic vs Usage Separation */}
            <Card className="bg-white shadow-lg border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Traffic vs Real Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {retentionStats.engagementMetrics.totalUsers}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Registered Users</div>
                    <div className="text-xs text-gray-500 mt-1">Total signups</div>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-4xl font-bold text-green-700 mb-2">
                      {retentionStats.engagementMetrics.loggedInUsers}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Logged-In Users</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {retentionStats.engagementMetrics.loggedInPercentage}% of total
                    </div>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-4xl font-bold text-blue-700 mb-2">
                      {retentionStats.engagementMetrics.packageCreators}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Active Users</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Created packages ({retentionStats.engagementMetrics.packageCreatorsPercentage}%)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}