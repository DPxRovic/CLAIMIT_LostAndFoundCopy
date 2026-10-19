import React, { useState } from 'react';

/**
 * DatabaseSchemaNotice
 * Informs the developer/user when the Supabase project is connected but
 * the public.profiles database schema has not yet been executed in their SQL editor.
 */
export default function DatabaseSchemaNotice({ projectId = 'fqehjgpksojjwdjkzjdh' }) {
  const [copied, setCopied] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const sqlFilePath = 'supabase/migrations/20261019000001_create_account_schema.sql';

  const handleCopyPath = () => {
    navigator.clipboard.writeText(sqlFilePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      <aside
        aria-label="Database Setup Required"
        className="w-full bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 text-xs sm:text-sm font-['Inter',sans-serif] z-50 sticky top-0 shadow-xs"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold text-amber-950">
                Supabase Setup Required: Table <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">public.profiles</code> not found in project <span className="font-mono">{projectId}</span>
              </p>
              <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                Run the database migration in your Supabase SQL Editor to enable persistent profile storage and approval rules. Fallback in-memory authentication is currently active.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setShowSqlModal(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            >
              Setup Instructions
            </button>
            <a
              href={`https://supabase.com/dashboard/project/${projectId}/sql`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>Supabase SQL Editor</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </aside>

      {/* Setup Instructions Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E8E4D8] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4D8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  !
                </div>
                <div>
                  <h3 className="font-bold text-[#23261F] text-base">Initialize Supabase Database</h3>
                  <p className="text-xs text-[#6E6858]">Project: {projectId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="text-[#6E6858] hover:text-[#23261F] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-[#6E6858] space-y-3 leading-relaxed">
              <p>
                The Supabase credentials in <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">.env</code> are connected, but PostgreSQL tables (like <code className="font-mono">public.profiles</code>) must be provisioned once in your Supabase project.
              </p>

              <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#E8E4D8] space-y-2">
                <p className="font-semibold text-[#23261F]">How to run the migration:</p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>
                    Open the{' '}
                    <a
                      href={`https://supabase.com/dashboard/project/${projectId}/sql`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#5170ff] font-semibold hover:underline"
                    >
                      Supabase SQL Editor
                    </a>
                  </li>
                  <li>Click <strong>New query</strong></li>
                  <li>Open the file in this workspace: <br /><code className="font-mono bg-white px-2 py-0.5 rounded border border-[#E8E4D8] inline-block mt-1 font-semibold text-[#23261F]">{sqlFilePath}</code></li>
                  <li>Copy and paste its contents into the editor, then click <strong>Run</strong></li>
                </ol>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCopyPath}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-[#23261F] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? '✓ Migration path copied!' : 'Copy file path to clipboard'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 bg-[#5170ff] hover:bg-[#4767f6] text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
