import React from 'react';



export default function WorkflowActions({ role, app, onUpdate, onOpenConfirm, onSaveAssessment }) {
  const status = app.status;

  const isPaid = app.paymentDetails?.status === 'Verified' || app.workflowHistory?.some(h => h.status === 'Payment Submitted' || h.status === 'Pending BFP');
  
  // Check history to see what has been done
  const hasBfpApproval = app.workflowHistory?.some(h => h.comments?.includes('BFP Inspection Passed'));
  const hasMayorApproval = app.workflowHistory?.some(h => h.comments?.includes('Mayor Permit Approved'));

  // --- SHARED HANDLER: REJECT ---
  const handleReject = () => {
    onOpenConfirm({
      title: 'Reject Application',
      message: 'Please enter the reason for rejection. This will be sent to the applicant.',
      showInput: true,
      confirmText: 'Confirm Rejection',
      onConfirm: (note) => {
        const prefix = role === 'bfpadmin' ? 'BFP Rejection: ' : (role === 'mayoradmin' ? 'Mayor Rejection: ' : 'MEO Rejection: ');
        onUpdate(app._id, 'Rejected', {
          comments: prefix + note,
          isResolved: false,
        });
      },
    });
  };

  // --- MEO ADMIN ---
  if (role === 'meoadmin') {
    switch (status) {
      case 'Submitted':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Step 1: Review documents.</p>
            <button onClick={() => onUpdate(app._id, 'Pending MEO', { comments: 'Accepted for review.' })} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Accept & Review</button>
            <button onClick={handleReject} className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">Reject Application</button>
          </div>
        );

      case 'Pending MEO':
        // Check if this is a assessment OR a return from BFP/Mayor
        if (isPaid) {
             return (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 font-medium">Application returned to MEO.</p>
                    
                    {/* If BFP approved but Mayor hasn't */}
                    {hasBfpApproval && !hasMayorApproval && (
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-xs text-blue-800 mb-2">BFP has issued FSEC. Forward to Mayor?</p>
                            <button onClick={() => onUpdate(app._id, 'Pending Mayor', { comments: 'MEO: Forwarding to Mayor for endorsement.' })} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                                Forward to Mayor
                            </button>
                        </div>
                    )}

                    {/* If Mayor has approved */}
                    {hasMayorApproval && (
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                            <p className="text-xs text-green-800 mb-2">Mayor has endorsed. Ready for Final Approval?</p>
                            <button onClick={() => onUpdate(app._id, 'Approved', { comments: 'MEO: Final Approval Granted. Ready for Permit Issuance.' })} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                                Final Approve
                            </button>
                        </div>
                    )}
                    
                    {/* If neither BFP nor Mayor have approved yet */}
                    {!hasBfpApproval && (
                         <button onClick={() => onUpdate(app._id, 'Pending BFP', { comments: 'MEO: Forwarding to BFP.' })} className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">
                            Forward to BFP
                        </button>
                    )}
                </div>
             );
        } 
        
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Step 2: Assess Fees.</p>
            <button onClick={onSaveAssessment} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save & Publish Assessment</button>
            <button onClick={handleReject} className="w-full px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg">Flag Issues</button>
          </div>
        );


      case 'Payment Pending':
         return <p className="text-sm text-gray-500">Waiting for payment...</p>;

      case 'Payment Submitted':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Verify Proof of Payment.</p>
            <div className="flex gap-2">
                <button onClick={() => onUpdate(app._id, 'Pending BFP', { comments: 'Payment Verified. Forwarding to BFP.' })} className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg">Accept</button>
                <button onClick={() => onUpdate(app._id, 'Payment Pending', { comments: 'Invalid Receipt.' })} className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg">Reject</button>
            </div>
          </div>
        );


      case 'Approved': 
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Final Approval Granted. Issue Permit.</p>
            <button onClick={() => onOpenConfirm({
                  title: 'Issue Final Permit',
                  message: 'This will generate the permit number and notify the user.',
                  onConfirm: () => onUpdate(app._id, 'Permit Issued', { comments: 'Official Permit Issued.' })
              })} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Issue Final Permit</button>
          </div>
        );
      default: return <p className="text-sm text-gray-500">Status: {status} (Waiting for other dept)</p>;
    }
  }

  // --- BFP ADMIN ---
  if (role === 'bfpadmin') {
    switch (status) {
      case 'Pending BFP':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-bold">Action Required:</p>
                <p className="text-xs text-blue-600 mt-1">Review Docs & Site Inspection.</p>
            </div>
            
            {/* if approve: Send back to MEO with 'Pending MEO' status */}
            <button
              onClick={() => {
                onOpenConfirm({
                  title: 'Approve & Issue FSEC',
                  message: 'Confirm inspection passed? This will notify MEO that FSEC is issued.',
                  confirmText: 'Approve (Notify MEO)',
                  onConfirm: () => {
                    onUpdate(app._id, 'Pending Mayor', { 
                        comments: 'BFP Inspection Passed. FSEC Issuance Completed. Forwarded to Mayor.' 
                    });
                  }
                });
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-sm"
            >
              Approve FSEC
            </button>

            {/* REJECT */}
            <button onClick={handleReject} className="w-full px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium">
              Reject / Flag
            </button>
          </div>
        );
      default:
        return <div className="text-center p-4 bg-gray-50 rounded-lg text-sm text-gray-500">No actions available.</div>;
    }
  }

  // --- MAYOR ADMIN ---
  if (role === 'mayoradmin') {
    switch (status) {
      case 'Pending Mayor':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Review endorsements.</p>
            
            {/* APPROVE: Sends back to MEO with 'Pending MEO' status */}
            <button 
                onClick={() => onUpdate(app._id, 'Pending MEO', { comments: "Mayor Permit Approved. Returned to MEO for finalization." })} 
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Approve
            </button>
            
            <button onClick={handleReject} className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">
              Reject
            </button>
          </div>
        );
      default:
        return <p className="text-sm text-gray-500">No actions available.</p>;
    }
  }

  const handleApproveAndIssue = () => {
    onOpenConfirm({
      title: 'Approve and Issue Permit',
      message: `Are you sure you want to approve and issue the permit for ${app.referenceNo}?`,
      showInput: false,
      confirmText: 'Final Approve',
      onConfirm: () => {
        onUpdate(app._id, 'Permit Issued', {
          comments: 'Permit approved and issued.',
        });
      },
    });
  };

  // Role-specific UI
  if (role === 'meoadmin') {
    switch (status) {
      case 'Submitted':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Step 1: Review documents and form data.</p>
            <button
              onClick={() => onUpdate(app._id, 'Pending MEO', { comments: 'Application is under review by MEO.' })}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Accept and Begin Review
            </button>
            <button onClick={handleReject} className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              Mark as Incomplete/Reject
            </button>
          </div>
        );
      case 'Pending MEO':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Step 2: Fill out Box 5 & 6 then publish assessment.</p>
            <button onClick={onSaveAssessment} className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Save & Publish Assessment
            </button>
            <p className="text-sm text-gray-600 pt-2 border-t mt-2">Or, flag missing documents in Details & Checklist.</p>
          </div>
        );
    case 'Payment Pending':
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Waiting for applicant to pay. Confirm if paid offline.</p>
          <button
            onClick={() => onUpdate(app._id, 'Pending BFP', { comments: 'Payment confirmed (Walk-in). Forwarding to BFP.' })}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Confirm Payment
          </button>
        </div>
      );

      case 'Payment Submitted':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-blue-600">Action Required:</span> Applicant has uploaded proof of payment.
              Check "Details & Checklist" tab to view the receipt.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => onUpdate(app._id, 'Pending BFP', { comments: 'Online Payment Verified. Forwarding to BFP.' })}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Verify & Approve
              </button>
              <button
                onClick={() => onUpdate(app._id, 'Payment Pending', { comments: 'Payment Proof Rejected. Please re-upload valid receipt.' })}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Reject Receipt
              </button>
            </div>
          </div>
        );

      case 'Pending BFP':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Waiting for BFP. Override if clearance received manually.</p>
            <button
              onClick={() => onUpdate(app._id, 'Pending Mayor', { comments: 'BFP clearance received. Forwarding to Mayor.' })}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              BFP Clearance Received (Forward to Mayor)
            </button>
          </div>
        );
      case 'Pending Mayor':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Waiting for Mayor's Office approval.</p>
            <button
              onClick={() => onUpdate(app._id, 'Approved', { comments: "Approved by Mayor's office." })}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Mayor Endorsement Received
            </button>
          </div>
        );
      case 'Approved':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">All endorsements complete. Issue the final permit.</p>
            <button onClick={handleApproveAndIssue} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Issue Final Permit
            </button>
          </div>
        );
      case 'Permit Issued':
        return <p className="text-sm font-semibold text-center text-green-600">PROCESS COMPLETED</p>;
      case 'Rejected':
        return <p className="text-sm font-semibold text-center text-red-600">Application Rejected. Waiting for resubmission.</p>;
      default:
        return <p className="text-sm text-gray-500">No actions available.</p>;
    }
  }

if (role === 'bfpadmin') {
    switch (status) {
      case 'Pending BFP':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              <strong>Action Required:</strong> Conduct physical inspection and review fire safety compliance.
            </p>
            
            {/* APPROVE BUTTON */}
            <button
              onClick={() => {
                onOpenConfirm({
                  title: 'Approve FSEC Issuance',
                  message: 'Confirm that the inspection passed. This will notify the MEO and the client to claim the FSEC at the BFP Office.',
                  confirmText: 'Approve & Notify',
                  onConfirm: () => {
                    onUpdate(app._id, 'Pending Mayor', { 
                      comments: 'BFP Inspection Passed. FSEC Issued. Forwarded to Mayor for final approval.' 
                    });
                  }
                });
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center font-medium shadow-sm transition"
            >
              Approve FSEC
            </button>

            {/* REJECT BUTTON */}
            <button
              onClick={() => {
                onOpenConfirm({
                  title: 'Reject Application / Flag Violations',
                  message: 'Please enter the inspection findings or missing requirements. This will return the application to MEO/User for correction.',
                  showInput: true, 
                  confirmText: 'Reject Application',
                  onConfirm: (reason) => {
                    onUpdate(app._id, 'Rejected BFP', {
                      comments: `BFP Rejection: ${reason}`,
                    });
                  }
                });
              }}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center font-medium shadow-sm transition"
            >
              Reject / Flag Missing
            </button>
          </div>
        );
        
      default:
        return <p className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded border">No actions available for this status.</p>;
    }
  }

  

  return <p className="text-sm text-gray-500">No actions available.</p>;
}
