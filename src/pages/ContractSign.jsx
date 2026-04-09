import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { renderContractToHtml, replaceMergeFields } from '@/components/contracts/TipTapEditor';
import SignaturePad from '@/components/contracts/SignatureCanvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Download, Loader2, RotateCcw, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { logContractView, updateContractTimeSpent } from '@/lib/contractAnalytics';

export default function ContractSign() {
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get('shareId');
  const isPreviewMode = searchParams.get('preview') === 'true';

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState('view');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const [pdfUrl, setPdfUrl] = useState('');
  const [signedContractId, setSignedContractId] = useState(null);
  const [signedContract, setSignedContract] = useState(null);

  const sigRef = useRef(null);
  const contractBodyRef = useRef(null);
  const viewIdRef = useRef(null);
  const viewStartedAtRef = useRef(null);

  useEffect(() => {
    if (!shareId) { setNotFound(true); setLoading(false); return; }
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*')
          .eq('shareable_link', shareId)
          .single();
        if (error || !data) { setNotFound(true); }
        else {
          setContract(data);
          if (data.status === 'signed') {
            const { data: signedList } = await supabase
              .from('signed_contracts')
              .select('*')
              .eq('contract_id', data.id)
              .order('signed_at', { ascending: false })
              .limit(1);
            setSignedContract(signedList?.[0] || null);
          }
        }
      } catch (e) {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [shareId]);

  useEffect(() => {
    if (!contract?.id || isPreviewMode) return undefined;

    let active = true;
    viewStartedAtRef.current = Date.now();
    logContractView(contract.id).then((viewId) => {
      if (!active) return;
      viewIdRef.current = viewId;
    });

    const flush = () => {
      const started = viewStartedAtRef.current;
      if (!started || !viewIdRef.current) return;
      const seconds = (Date.now() - started) / 1000;
      updateContractTimeSpent(viewIdRef.current, seconds);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      active = false;
      flush();
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [contract?.id, isPreviewMode]);

  const renderedHtml = contract
    ? replaceMergeFields(
        renderContractToHtml(contract.body, contract.accent_color || '#ff0044'),
        contract.merge_field_definitions || []
      )
    : '';

  const normalizeExternalUrl = (url) => {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed.replace(/^\/+/, '')}`;
  };

  const getClientIp = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const json = await res.json();
      return json.ip || '';
    } catch { return ''; }
  };

  const generatePdf = async (signedBody, signatureDataUrl) => {
    try {
      const div = document.createElement('div');
      if (contract?.logo_url) {
        const logoWrap = document.createElement('div');
        logoWrap.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;gap:12px;';
        logoWrap.innerHTML = `<img src="${contract.logo_url}" alt="Logo" style="max-height:80px;max-width:280px;object-fit:contain;display:block;" />`;
        div.appendChild(logoWrap);
      }
      const bodyWrap = document.createElement('div');
      bodyWrap.innerHTML = signedBody;
      div.appendChild(bodyWrap);
      div.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;font-family:Inter,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;background:white;padding:40px;';
      const sigSection = document.createElement('div');
      sigSection.style.cssText = 'margin-top:32px;padding-top:16px;border-top:2px solid #e5e7eb;';
      sigSection.innerHTML = `<p style="font-size:12px;color:#6b7280;margin:0 0 8px;">Client Signature</p>`;
      const sigImg = document.createElement('img');
      sigImg.src = signatureDataUrl;
      sigImg.style.cssText = 'max-width:240px;max-height:100px;display:block;';
      sigSection.appendChild(sigImg);
      sigSection.innerHTML += `<p style="font-size:12px;color:#6b7280;margin:8px 0 0;">Signed: ${new Date().toLocaleString()}</p>`;
      div.appendChild(sigSection);
      document.body.appendChild(div);

      const canvas = await html2canvas(div, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      document.body.removeChild(div);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgRatio = canvas.width / canvas.height;
      let imgH = pageWidth / imgRatio;
      let position = 0;
      const imgData = canvas.toDataURL('image/png');

      if (imgH <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgH);
      } else {
        while (position < imgH) {
          pdf.addImage(imgData, 'PNG', 0, -position, pageWidth, imgH);
          position += pageHeight;
          if (position < imgH) pdf.addPage();
        }
      }

      const pdfBlob = pdf.output('blob');
      setPdfUrl(URL.createObjectURL(pdfBlob));
    } catch (e) {
      console.warn('PDF generation failed:', e);
    }
  };

  const handleSign = async () => {
    if (isPreviewMode) return;
    if (!clientName.trim()) { setError('Please enter your name.'); return; }
    if (!sigRef.current || sigRef.current.isEmpty()) { setError('Please draw your signature.'); return; }
    setError('');
    setSubmitting(true);

    try {
      const signatureDataUrl = sigRef.current.toDataURL('image/png');
      const clientIp = await getClientIp();
      const frozenHtml = renderedHtml;
      const now = new Date().toISOString();

      // Insert signed contract record (public RLS allows this)
      const { data: signedRecord, error: insertError } = await supabase
        .from('signed_contracts')
        .insert([{
          contract_id: contract.id,
          client_name: clientName.trim(),
          client_email: clientEmail.trim() || null,
          signed_body: frozenHtml,
          signature_image: signatureDataUrl,
          signed_at: now,
          client_ip: clientIp,
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      setSignedContractId(signedRecord.id);

      // Server-side: update contract status + send notification
      try {
        await supabase.functions.invoke('handle-contract-signed', {
          body: {
            contract_id: contract.id,
            signed_contract_id: signedRecord.id,
            client_name: clientName.trim(),
          },
        });
      } catch (fnErr) {
        console.warn('Post-sign function failed (non-blocking):', fnErr);
      }

      setStep('complete');
      generatePdf(frozenHtml, signatureDataUrl);
    } catch (e) {
      console.error('Signing failed:', e);
      setError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  const accentColor = contract?.accent_color || '#ff0044';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Contract not found</h2>
          <p className="text-gray-500">This link may be invalid or the contract has been removed.</p>
        </div>
      </div>
    );
  }

  const isExpired = contract.expires_at && new Date(contract.expires_at) < new Date();
  const isSigned = contract.status === 'signed';

  if (isSigned && step === 'view') {
    const signedBody = signedContract?.signed_body || renderedHtml;
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
          <div className="flex items-start justify-between mb-8 gap-4">
            {contract.logo_url && (
              <img src={contract.logo_url} alt="Logo" className="max-h-20 object-contain" />
            )}
            <div className="text-right">
              {contract.name && <h1 className="text-lg font-semibold text-gray-700">{contract.name}</h1>}
              <p className="text-sm text-green-600 font-medium mt-1 flex items-center justify-end gap-1">
                <CheckCircle2 className="w-4 h-4" /> Signed
              </p>
            </div>
          </div>

          <div
            className="prose max-w-none mb-8"
            style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
            dangerouslySetInnerHTML={{ __html: signedBody }}
          />

          {signedContract && (
            <>
              <hr style={{ borderColor: `${accentColor}40`, borderTopWidth: 2, marginBottom: 24 }} />
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Client Signature</h2>
                {signedContract.signature_image && (
                  <img src={signedContract.signature_image} alt="Signature" className="max-w-[240px] max-h-[100px] border-b-2 border-gray-300 pb-1" />
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {signedContract.client_name}
                  {signedContract.signed_at && ` • ${new Date(signedContract.signed_at).toLocaleString()}`}
                </p>
              </div>
            </>
          )}
        </div>
        <footer className="py-4 text-center">
          <a href="https://www.launchbox.so" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Powered by LaunchBox
          </a>
        </footer>
      </div>
    );
  }

  if (isExpired && !isSigned) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          {contract.logo_url && (
            <img src={contract.logo_url} alt="Logo" className="max-h-16 object-contain mb-8" />
          )}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <AlertCircle className="w-10 h-10" style={{ color: accentColor }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Contract Expired</h1>
          <p className="text-gray-600 max-w-md mb-2">
            This contract expired on {new Date(contract.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
          </p>
          <p className="text-gray-500 text-sm">Please contact the sender if you need a new contract.</p>
        </div>
        <footer className="py-4 text-center">
          <a href="https://www.launchbox.so" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Powered by LaunchBox
          </a>
        </footer>
      </div>
    );
  }

  if (step === 'complete') {
    const msg = contract.custom_confirmation_message || "Congrats, you're all set! We'll be in touch shortly with next steps.";
    const nextStepUrl = normalizeExternalUrl(contract.custom_button_link);
    const hasNextStepCta = Boolean(nextStepUrl && (contract.custom_button_label || '').trim());
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          {contract.logo_url && (
            <img src={contract.logo_url} alt="Logo" className="max-h-16 object-contain mb-8" />
          )}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-green-50"
          >
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Document Signed!</h1>
          <p className="text-gray-600 max-w-md mb-8">{msg}</p>

          <div className={`flex flex-col sm:flex-row gap-3 w-full max-w-xs ${hasNextStepCta ? '' : 'justify-center mx-auto'}`}>
            {hasNextStepCta && (
              <a
                href={nextStepUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-6 rounded-xl font-semibold text-white text-center transition-opacity hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                {contract.custom_button_label || 'Book Your Kickoff Call'}
              </a>
            )}
            {pdfUrl ? (
              <a
                href={pdfUrl}
                download={`${contract.name}-signed.pdf`}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download Copy
              </a>
            ) : signedContractId ? (
              <span className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Preparing PDF…
              </span>
            ) : null}
          </div>
        </div>

        <footer className="py-4 text-center">
          <a
            href="https://www.launchbox.so"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Powered by LaunchBox
          </a>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <div className="flex items-start justify-between mb-8 gap-4">
          {contract.logo_url && (
            <img src={contract.logo_url} alt="Logo" className="max-h-20 object-contain" />
          )}
          <div className="text-right">
            {contract.name && (
              <h1 className="text-lg font-semibold text-gray-700">{contract.name}</h1>
            )}
            {contract.expires_at && (
              <p className="text-sm text-gray-500 mt-1">
                Expires: {new Date(contract.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        <div
          ref={contractBodyRef}
          className="prose max-w-none mb-12"
          style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />

        <hr style={{ borderColor: `${accentColor}40`, borderTopWidth: 2, marginBottom: 32 }} />

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Client Signature</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Your full name"
                className="max-w-sm"
                disabled={isPreviewMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-gray-400 font-normal">(optional)</span></label>
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="your@email.com"
                className="max-w-sm"
                disabled={isPreviewMode}
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Signature</label>
            <div className="max-w-md">
              <SignaturePad
                ref={sigRef}
                accentColor={accentColor}
                disabled={isPreviewMode}
                onChange={() => setSignatureEmpty(sigRef.current?.isEmpty() ?? true)}
              />
            </div>
            <button
              type="button"
              onClick={() => { sigRef.current?.clear(); setSignatureEmpty(true); }}
              disabled={isPreviewMode}
              className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear signature
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5 mt-3 mb-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}

          {contract.consent_text !== '' && (
            <p className="text-xs text-gray-400 mt-4 max-w-sm">
              {contract.consent_text || 'By clicking "Sign Document", you agree that your signature is the legal equivalent of your handwritten signature.'}
            </p>
          )}

          <Button
            onClick={handleSign}
            disabled={submitting || isPreviewMode}
            className="w-full sm:w-auto mt-3 py-3 px-8 rounded-xl font-semibold text-white text-base"
            style={{ backgroundColor: accentColor, minWidth: 200 }}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing…</>
            ) : (
              (isPreviewMode ? 'Preview Mode' : 'Sign Document')
            )}
          </Button>
        </div>
      </div>

      <footer className="py-5 text-center border-t border-gray-100">
        <a
          href="https://www.launchbox.so"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Powered by LaunchBox
        </a>
      </footer>
    </div>
  );
}
