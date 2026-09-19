import React from 'react';
import { Check, Clock, AlertCircle, CornerDownRight, FileSearch, ExternalLink } from 'lucide-react';

export interface PipelineTimelineProps {
  isFirstTime?: boolean;
  status: string; // e.g., 'CLONING', 'SCANING', 'WAITING_LLM_JUDGE', 'GENERATING', 'PR_OPEN', 'COMPLETED', 'DROPPED', 'FAILED'
  reasoning?: string | null;
  prLink?: string | null;
}

export const PipelineTimeline: React.FC<PipelineTimelineProps> = ({
  isFirstTime = false,
  status = 'COMPLETED',
  reasoning = null,
  prLink = null,
}) => {
  const isDropped = status === 'DROPPED' || status === 'LLM_JUDGE_REJECTED';
  const isFailed = status === 'FAILED';

  const firstTimeStages = [
    { id: 1, label: 'Cloning Repo' },
    { id: 2, label: 'Parsing Codebase' },
    { id: 3, label: 'Building Prompt' },
    { id: 4, label: 'Awaiting LLM Response' },
    { id: 5, label: 'Finishing Up' },
    { id: 6, label: 'PR Raised' },
  ];

  const webhookStages = [
    { id: 1, label: 'Cloning Repo' },
    { id: 2, label: 'Parsing Codebase' },
    { id: 3, label: 'Checking Docs Revision' },
    { id: 4, label: 'Building Prompt' },
    { id: 5, label: 'Awaiting LLM Response' },
    { id: 6, label: 'Finishing Up' },
    { id: 7, label: 'PR Raised' },
  ];

  const stages = isFirstTime ? firstTimeStages : webhookStages;

  // Determine stage status: 'completed' | 'active' | 'pending' | 'dropped'
  const getStageState = (stageId: number): 'completed' | 'active' | 'pending' | 'dropped' | 'failed' => {
    if (isFirstTime) {
      switch (stageId) {
        case 1:
          if (['SCANING', 'PENDING', 'GENERATING', 'PR_OPEN', 'COMPLETED', 'MERGED'].includes(status)) return 'completed';
          if (status === 'CLONING') return 'active';
          if (isFailed) return 'failed';
          return 'pending';
        case 2:
          if (['PENDING', 'GENERATING', 'PR_OPEN', 'COMPLETED', 'MERGED'].includes(status)) return 'completed';
          if (status === 'SCANING') return 'active';
          if (isFailed) return 'failed';
          return 'pending';
        case 3:
          if (['GENERATING', 'PR_OPEN', 'COMPLETED', 'MERGED'].includes(status)) return 'completed';
          if (status === 'PENDING') return 'active';
          return 'pending';
        case 4:
          if (['PR_OPEN', 'COMPLETED', 'MERGED'].includes(status)) return 'completed';
          if (status === 'GENERATING') return 'active';
          return 'pending';
        case 5:
        case 6:
          if (['PR_OPEN', 'COMPLETED', 'MERGED'].includes(status)) return 'completed';
          return 'pending';
        default:
          return 'pending';
      }
    } else {
      // Webhook pipeline
      if (stageId === 3 && isDropped) {
        return 'dropped';
      }
      if (isDropped && stageId > 3) {
        return 'pending'; // skipped after stage 3
      }

      switch (stageId) {
        case 1:
          if (['SCANING', 'WAITING_LLM_JUDGE', 'PENDING', 'GENERATING', 'PR_OPEN', 'COMPLETED', 'MERGED', 'DROPPED', 'LLM_JUDGE_REJECTED'].includes(status))
            return 'completed';
          if (status === 'CLONING') return 'active';
          return 'pending';
        case 2:
          if (['WAITING_LLM_JUDGE', 'PENDING', 'GENERATING', 'PR_OPEN', 'COMPLETED', 'MERGED', 'DROPPED', 'LLM_JUDGE_REJECTED'].includes(status))
            return 'completed';
          if (status === 'SCANING') return 'active';
          return 'pending';
        case 3:
          if (['PENDING', 'GENERATING', 'PR_OPEN', 'COMPLETED', 'MERGED'].includes(status)) return 'completed';
          if (status === 'WAITING_LLM_JUDGE') return 'active';
          if (isDropped) return 'dropped';
          return 'pending';
        case 4:
          if (['GENERATING', 'PR_OPEN', 'COMPLETED', 'MERGED'].includes(status)) return 'completed';
          if (status === 'PENDING') return 'active';
          return 'pending';
        case 5:
          if (['PR_OPEN', 'COMPLETED', 'MERGED'].includes(status)) return 'completed';
          if (status === 'GENERATING') return 'active';
          return 'pending';
        case 6:
        case 7:
          if (['PR_OPEN', 'COMPLETED', 'MERGED'].includes(status)) return 'completed';
          return 'pending';
        default:
          return 'pending';
      }
    }
  };

  // Find index up to which green line flows
  let lastCompletedIndex = -1;
  stages.forEach((stg, idx) => {
    const st = getStageState(stg.id);
    if (st === 'completed') {
      lastCompletedIndex = idx;
    }
  });

  return (
    <div
      style={{
        backgroundColor: '#09090b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '1.5rem',
        marginTop: '1rem',
      }}
    >
      {/* Pipeline Type Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: isFirstTime ? 'rgba(124, 58, 237, 0.15)' : 'rgba(52, 211, 153, 0.15)',
              border: `1px solid ${isFirstTime ? 'rgba(124, 58, 237, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
              color: isFirstTime ? '#a78bfa' : '#34d399',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {isFirstTime ? 'First-Time Import Pipeline' : 'Webhook Push Event Pipeline'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#71717a' }}>
            Status:{' '}
            <strong style={{ color: isDropped ? '#fbbf24' : isFailed ? '#ef4444' : '#34d399' }}>
              {status}
            </strong>
          </div>

          {/* PR Link Button at end of header/bar */}
          {prLink ? (
            <a
              href={prLink}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#10b981',
                borderColor: '#34d399',
                color: '#ffffff',
                boxShadow: '0 0 12px rgba(52, 211, 153, 0.4)',
                textDecoration: 'none',
              }}
            >
              PR Link <ExternalLink size={14} />
            </a>
          ) : (
            <button
              disabled
              className="btn btn-secondary"
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: 0.5,
                cursor: 'not-allowed',
              }}
            >
              PR Link
            </button>
          )}
        </div>
      </div>

      {/* Main Timeline Bar Container */}
      <div style={{ position: 'relative', width: '100%', padding: '1rem 0' }}>
        {/* Track Line */}
        <div
          style={{
            position: 'absolute',
            top: '28px',
            left: '3%',
            right: '3%',
            height: '3px',
            backgroundColor: '#27272a',
            zIndex: 1,
          }}
        >
          {/* Green Progress Line Overlay */}
          <div
            style={{
              height: '100%',
              backgroundColor: '#34d399',
              transition: 'width 0.4s ease-in-out',
              width:
                lastCompletedIndex >= 0
                  ? `${(lastCompletedIndex / (stages.length - 1)) * 100}%`
                  : '0%',
              boxShadow: '0 0 10px rgba(52, 211, 153, 0.6)',
            }}
          />
        </div>

        {/* Stages Grid */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'grid',
            gridTemplateColumns: `repeat(${stages.length}, 1fr)`,
            alignItems: 'start',
            textAlign: 'center',
          }}
        >
          {stages.map((stg) => {
            const st = getStageState(stg.id);
            const isCompleted = st === 'completed';
            const isActive = st === 'active';
            const isStageDropped = st === 'dropped';
            const isStageFailed = st === 'failed';

            return (
              <div
                key={stg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}
              >
                {/* Node Icon Circle */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isCompleted
                      ? '#34d399'
                      : isActive
                      ? '#121215'
                      : isStageDropped
                      ? '#fbbf24'
                      : isStageFailed
                      ? '#ef4444'
                      : '#18181b',
                    border: `2px solid ${
                      isCompleted
                        ? '#34d399'
                        : isActive
                        ? '#34d399'
                        : isStageDropped
                        ? '#fbbf24'
                        : isStageFailed
                        ? '#ef4444'
                        : '#34343d'
                    }`,
                    boxShadow: isActive
                      ? '0 0 12px rgba(52, 211, 153, 0.8)'
                      : isCompleted
                      ? '0 0 6px rgba(52, 211, 153, 0.3)'
                      : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isCompleted && <Check size={14} color="#09090b" strokeWidth={3} />}
                  {isActive && (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#34d399',
                        animation: 'pulse 1.2s infinite',
                      }}
                    />
                  )}
                  {isStageDropped && <AlertCircle size={14} color="#09090b" strokeWidth={3} />}
                  {isStageFailed && <AlertCircle size={14} color="#ffffff" strokeWidth={3} />}
                </div>

                {/* Stage Label */}
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isCompleted || isActive ? 700 : 500,
                    color: isCompleted
                      ? '#fafafa'
                      : isActive
                      ? '#34d399'
                      : isStageDropped
                      ? '#fbbf24'
                      : '#71717a',
                    lineHeight: 1.2,
                    maxWidth: '100px',
                  }}
                >
                  <span style={{ fontSize: '0.65rem', color: '#52525b', display: 'block' }}>
                    Stage {stg.id}
                  </span>
                  {stg.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WEBHOOK STAGE 3 DOWNWARD BRANCH FOR VERDICT = FALSE */}
      {!isFirstTime && isDropped && (
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px border-dashed #27272a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.75rem',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#fbbf24',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            <CornerDownRight size={18} color="#fbbf24" />
            <span>Stage 3 Verdict: Revision Not Needed</span>
          </div>

          <div
            style={{
              width: '100%',
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.85rem',
              color: '#a1a1aa',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              LLM Judge Analysis & Reasoning
            </div>
            {reasoning || 'The AST diff scanner and LLM judge evaluated the commit changes and determined that existing documentation remains accurate. No documentation update required.'}
          </div>
        </div>
      )}
    </div>
  );
};
