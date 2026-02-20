import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Clock, User, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HelpRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    if (user.role !== 'admin') {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setIsAdmin(true);
    const data = await base44.entities.HelpRequest.list('-created_date');
    setRequests(data);
    setLoading(false);
  };

  const toggleStatus = async (req) => {
    setUpdatingId(req.id);
    const newStatus = req.status === 'new' ? 'responded' : 'new';
    await base44.entities.HelpRequest.update(req.id, { status: newStatus });
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: newStatus } : r));
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
        <Loader2 className="w-12 h-12 animate-spin text-[#ff0044]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="text-center bg-white rounded-3xl p-12 shadow-lg border-2 border-red-200">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view help requests.</p>
        </div>
      </div>
    );
  }

  const newCount = requests.filter(r => r.status === 'new').length;

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Link to={createPageUrl('Admin')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Help Requests</h1>
            <p className="text-gray-500 text-sm mt-1">
              {requests.length} total · {newCount} new
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <Card className="bg-white shadow-sm mt-6">
            <CardContent className="py-16 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No help requests yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 mt-6">
            {requests.map((req) => {
              const isExpanded = expandedId === req.id;
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className={`bg-white shadow-sm border transition-all cursor-pointer hover:shadow-md ${
                      req.status === 'new' ? 'border-l-4 border-l-[#ff0044]' : 'border-l-4 border-l-green-400'
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  >
                    <CardContent className="p-5">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                              <User className="w-4 h-4 text-gray-400" />
                              {req.created_by}
                            </div>
                            <Badge
                              className={
                                req.status === 'new'
                                  ? 'bg-red-100 text-red-700 border-red-200'
                                  : 'bg-green-100 text-green-700 border-green-200'
                              }
                              variant="outline"
                            >
                              {req.status === 'new' ? 'New' : 'Responded'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(req.created_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {/* Message preview or full */}
                          <p className={`text-sm text-gray-700 whitespace-pre-wrap ${!isExpanded ? 'line-clamp-2' : ''}`}>
                            {req.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded actions */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-gray-100 flex gap-3"
                          >
                            <Button
                              size="sm"
                              variant={req.status === 'new' ? 'default' : 'outline'}
                              className={req.status === 'new' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStatus(req);
                              }}
                              disabled={updatingId === req.id}
                            >
                              {updatingId === req.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                              )}
                              {req.status === 'new' ? 'Mark as Responded' : 'Mark as New'}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}