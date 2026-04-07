import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import supabaseClient from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LayoutTemplate, Plus, Pencil, Trash2, Clock, FileText } from 'lucide-react';

export default function ContractTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await supabaseClient.auth.me();
        const list = await supabaseClient.entities.ContractTemplate.filter(
          { created_by: user.id },
          '-created_at'
        );
        setTemplates(list);
      } catch (e) {
        console.error('Failed to load templates:', e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const useTemplate = async (template) => {
    try {
      const newContract = await supabaseClient.entities.Contract.create({
        name: template.name,
        body: template.body,
        shareable_link: crypto.randomUUID(),
        accent_color: template.accent_color || '#ff0044',
        logo_url: template.logo_url || null,
        custom_confirmation_message: template.custom_confirmation_message ?? null,
        custom_button_label: template.custom_button_label ?? null,
        custom_button_link: template.custom_button_link ?? null,
        merge_field_definitions: [],
        status: 'draft',
      });
      navigate(`${createPageUrl('ContractEditor')}?contractId=${newContract.id}`);
    } catch (e) {
      console.error('Failed to create contract from template:', e);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await supabaseClient.entities.ContractTemplate.delete(deleteTarget.id);
      setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
    } catch (e) {
      console.error('Failed to delete template:', e);
    }
    setDeleteTarget(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="w-8 h-8 border-4 border-[#ff0044] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contract Templates</h1>
            <p className="text-gray-500 text-sm mt-1">Reusable starting points for your contracts</p>
          </div>
          <Button
            onClick={() => navigate(`${createPageUrl('ContractEditor')}?mode=template`)}
            className="gap-2 bg-[#ff0044] hover:bg-[#cc0033] text-white"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LayoutTemplate className="w-8 h-8 text-[#ff0044]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No templates yet</h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Save a contract as a template to reuse it. Templates let you start new contracts quickly.
            </p>
            <Button
              onClick={() => navigate(`${createPageUrl('ContractEditor')}?mode=template`)}
              className="bg-[#ff0044] hover:bg-[#cc0033] text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Create your first template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-[#ff0044]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{template.name}</h3>
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(template.created_at)}
                </p>
                <div className="mt-auto flex gap-2">
                  <Button
                    className="flex-1 bg-[#ff0044] hover:bg-[#cc0033] text-white text-sm"
                    onClick={() => useTemplate(template)}
                  >
                    Use Template
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`${createPageUrl('ContractEditor')}?templateEditId=${template.id}&mode=template`)}
                    title="Edit template"
                  >
                    <Pencil className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(template)}
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This template will be permanently deleted. Existing contracts created from this template won&apos;t be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
