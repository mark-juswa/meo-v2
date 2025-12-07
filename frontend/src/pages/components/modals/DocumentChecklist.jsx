import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  ExclamationTriangleIcon, 
  CheckBadgeIcon 
} from '@heroicons/react/24/outline';
import useAxiosPrivate from '../../../hooks/useAxiosPrivate';

export default function DocumentChecklist({ app, role, onUpdate }) {
  const axiosPrivate = useAxiosPrivate();
  const uploadedDocs = app.documents || [];
  const missingDocs = app.rejectionDetails?.missingDocuments || [];
  const [newItem, setNewItem] = useState('');

  const canFlag = role === 'meoadmin' || role === 'bfpadmin';
  const canResolve = role === 'meoadmin' || role === 'bfpadmin';
  const paymentProof = app.paymentDetails?.proofOfPaymentFile;

  const handleViewPaymentProof = async () => {
    try {
      const response = await axiosPrivate.get(`/api/applications/${app._id}/payment-proof`, {
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
   
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error viewing payment proof:', error);
      alert('Failed to load payment proof. Please try again.');
    }
  };

  const handleViewDocument = async (documentIndex) => {
    try {
      // Validate app._id exists and is complete
      if (!app._id || app._id.length < 24) {
        console.error('Invalid application ID:', app._id);
        console.error('Full app object:', app);
        alert(`Invalid application ID: ${app._id}. Please refresh the page and try again.`);
        return;
      }

      const url = `/api/applications/${app._id}/documents/${documentIndex}/file`;
      console.log('Fetching document from URL:', url);
      
      const response = await axiosPrivate.get(url, {
        responseType: 'blob'
      });
      
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error('Error viewing document:', error);
      console.error('App ID:', app._id, 'Document Index:', documentIndex);
      alert('Failed to load document. Please try again.');
    }
  };

  const handleAddMissingItem = () => {
    if (!newItem.trim()) return;
    const updated = [...missingDocs, newItem.trim()];
    onUpdate(app._id, 'Rejected', {
      comments: `Marked incomplete. Missing: ${newItem.trim()}`,
      missingDocuments: updated,
      isResolved: false,
    });
    setNewItem('');
  };

  const handleRemoveMissingItem = (itemToRemove) => {
    const updated = missingDocs.filter((i) => i !== itemToRemove);
    
    const lastRejection = app.workflowHistory?.slice().reverse().find(h => h.status === 'Rejected');
    const isBfpRejection = lastRejection?.comments?.toLowerCase().includes('bfp');
    
    const defaultPending = isBfpRejection ? 'Pending BFP' : 'Pending MEO';
    const newStatus = updated.length === 0 ? defaultPending : 'Rejected';
    
    const comment = updated.length === 0 ? 'All document deficiencies resolved.' : `Resolved: ${itemToRemove}`;

    onUpdate(app._id, newStatus, {
      comments: comment,
      missingDocuments: updated,
      isResolved: updated.length === 0,
    });
  };

  // Create arrays with original indices preserved
  const docsWithIndices = uploadedDocs.map((doc, index) => ({ doc, originalIndex: index }));
  const revisions = docsWithIndices.filter(d => d.doc.requirementName === 'Revised Checklist/Documents');
  const standardDocs = docsWithIndices.filter(d => d.doc.requirementName !== 'Revised Checklist/Documents');

  return (
    <div>
      <h4 className="text-lg font-semibold border-b pb-2 mb-3 text-gray-800">Document Checklist</h4>

      {/* Original Submission */}
      <div className="space-y-3 mb-8">
        <h5 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">Original Requirements</h5>
        {standardDocs.length === 0 && (
          <p className="text-sm text-gray-400 p-3 italic border border-dashed border-gray-200 rounded-lg text-center">
            No original documents found.
          </p>
        )}
        {standardDocs.map((item, i) => (
          <div key={i} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition">
            <div className="flex items-center">
                <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3"/>
                <span className="font-medium text-sm text-gray-700">{item.doc.requirementName}</span>
            </div>
            <button 
              onClick={() => handleViewDocument(item.originalIndex)}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-md border-none cursor-pointer"
            >
              View
            </button>
          </div>
        ))}
      </div>

      {/* FLAGGED ISSUES SECTION */}
      <div className="mt-6 pt-6 border-t-2 border-gray-100">
        <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
            <h5 className="text-md font-bold text-gray-800">Flagged Issues & Revisions</h5>
        </div>

        {/* LIST OF MISSING ITEMS */}
        <div className="space-y-2 mb-4">
          {missingDocs.length === 0 ? (
            <p className="text-sm text-gray-400 italic ml-1">No active flags.</p>
          ) : (
            missingDocs.map((docName, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-lg">
                <span className="font-medium text-sm text-red-700 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {docName}
                </span>
                {canResolve && (
                  <button 
                    onClick={() => handleRemoveMissingItem(docName)} 
                    title="Mark as resolved" 
                    className="text-xs font-bold text-green-600 hover:text-green-800 bg-white border border-green-200 px-2 py-1 rounded shadow-sm"
                  >
                    Resolve
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* SHOW USER UPLOADED REVISIONS HERE */}
        {revisions.length > 0 && (
             <div className="mt-4 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-pulse-once">
                <div className="flex items-center justify-between mb-2">
                    <h6 className="text-sm font-bold text-green-800 flex items-center">
                        <CheckBadgeIcon className="w-4 h-4 mr-1"/> 
                        Applicant Submitted Revisions
                    </h6>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">Latest</span>
                </div>
                <div className="space-y-2">
                    {revisions.map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-3 rounded border border-green-100 shadow-sm">
                            <div>
                                <p className="text-sm font-semibold text-gray-800 flex items-center">
                                  <DocumentTextIcon className="w-4 h-4 text-green-600 mr-2"/>
                                  {item.doc.fileName || item.doc.requirementName}
                                </p>
                                <p className="text-xs text-gray-500 ml-6">Uploaded: {new Date(item.doc.uploadedAt).toLocaleString()}</p>
                            </div>
                            <button 
                                onClick={() => handleViewDocument(item.originalIndex)} 
                                className="text-xs font-bold text-green-700 hover:underline flex items-center bg-transparent border-none cursor-pointer"
                            >
                                <ArrowDownTrayIcon className="w-3 h-3 mr-1"/> View File
                            </button>
                        </div>
                    ))}
                </div>
             </div>
        )}

        {/* INPUT TO ADD NEW FLAGS */}
        {canFlag && (
          <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Flag new missing item..."
              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <button 
                onClick={handleAddMissingItem} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-lg transition"
            >
              Flag
            </button>
          </div>
        )}
      </div>

      {/* PROOF OF PAYMENT SECTION */}
      {paymentProof && (
        <div className="mt-8 pt-6 border-t-2 border-gray-100">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="text-sm font-bold text-blue-800 mb-2 uppercase tracking-wide">Proof of Payment</h5>
            <div className="flex items-center justify-between bg-white p-3 rounded border border-blue-100">
               <span className="text-sm text-gray-600">Receipt / Screenshot</span>
               <button 
                 onClick={handleViewPaymentProof}
                 className="text-sm font-bold text-blue-600 hover:underline cursor-pointer bg-transparent border-none"
               >
                 View Image
               </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Submitted: {app.paymentDetails?.dateSubmitted ? new Date(app.paymentDetails.dateSubmitted).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}