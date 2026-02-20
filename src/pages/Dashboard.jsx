import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Package, FileText } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Dashboard: Error loading user data:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-10 mt-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Welcome back, {user?.full_name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-lg text-gray-600">
              Ready to create beautiful pricing packages?
            </p>
          </motion.div>
        </div>

        {/* Main Action Card - Create Package */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 shadow-lg border-2 border-gray-100 relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-red-50 to-pink-50 rounded-full -mr-32 -mt-32 opacity-50" />
          
          <div className="relative z-10 text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Create a New Package
            </h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              Build professional pricing packages in minutes with our AI-powered builder or start from a ready-made template
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.href = createPageUrl('PackageBuilder')}
                size="lg"
                className="h-12 px-6 font-semibold rounded-full text-white shadow-lg hover:shadow-xl transition-all"
                style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
              >
                Build from Scratch
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button
                onClick={() => window.location.href = createPageUrl('Templates')}
                size="lg"
                variant="outline"
                className="h-12 px-6 font-semibold rounded-full border-2 border-gray-300 hover:border-[#ff0044] hover:bg-red-50"
              >
                <FileText className="w-4 h-4 mr-2" />
                Use a Template
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}