import React from 'react';
import { ChevronDown, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

/* Hallmark · component: topbar · genre: atmospheric · theme: DroneDeploy-dark
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass (APCA Lc >= 60)
 */

export const NavbarPreview: React.FC = () => {
  return (
    <div style={{
      background: '#0B0E14',
      color: '#FFFFFF',
      padding: '40px',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      minHeight: '100vh'
    }}>
      <style>{`
        /* Import the styles for demonstration if global is not loaded */
        .preview-section {
          margin-bottom: 48px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 32px;
        }
        .preview-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 24px;
          color: #00E5FF;
          letter-spacing: -0.01em;
        }
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .preview-card {
          background: #121721;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .state-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #8E9BAE;
        }
        .state-element-wrap {
          display: flex;
          align-items: center;
          min-height: 48px;
        }

        /* ── NAVBAR BUTTON & DROPDOWN TRIGGER STATES ── */
        .preview-btn-nav {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 4px;
          transition: color 150ms, background 150ms;
        }
        .preview-btn-nav:hover, .preview-btn-nav.is-hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.05);
        }
        .preview-btn-nav:focus-visible, .preview-btn-nav.is-focus {
          outline: 2px solid #00E5FF;
          outline-offset: 2px;
          color: #FFFFFF;
        }
        .preview-btn-nav:active, .preview-btn-nav.is-active {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.1);
        }
        .preview-btn-nav:disabled, .preview-btn-nav[aria-disabled="true"] {
          opacity: 0.55;
          cursor: not-allowed;
          background: transparent !important;
          color: rgba(255, 255, 255, 0.3) !important;
        }

        /* ── PILL GHOST BUTTON STATES ── */
        .preview-pill-ghost {
          background: transparent;
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 9999px;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 150ms, background 150ms, transform 150ms;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .preview-pill-ghost:hover, .preview-pill-ghost.is-hover {
          border-color: #FFFFFF;
          background: rgba(255, 255, 255, 0.05);
        }
        .preview-pill-ghost:focus-visible, .preview-pill-ghost.is-focus {
          outline: 2px solid #00E5FF;
          outline-offset: 3px;
        }
        .preview-pill-ghost:active, .preview-pill-ghost.is-active {
          transform: translateY(1px);
          background: rgba(255, 255, 255, 0.1);
        }
        .preview-pill-ghost:disabled, .preview-pill-ghost[aria-disabled="true"] {
          opacity: 0.55;
          cursor: not-allowed;
          border-color: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.4);
        }
        .preview-pill-ghost[data-state="loading"] {
          pointer-events: none;
          opacity: 0.8;
        }
        .preview-pill-ghost[data-state="error"] {
          border-color: #FF5252;
          color: #FF5252;
        }
        .preview-pill-ghost[data-state="success"] {
          border-color: #00FF9D;
          color: #00FF9D;
        }

        /* ── PILL SOLID BUTTON STATES ── */
        .preview-pill-solid {
          background: #FFFFFF;
          color: #000000;
          border: 1px solid #FFFFFF;
          border-radius: 9999px;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 150ms, transform 150ms, box-shadow 150ms;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .preview-pill-solid:hover, .preview-pill-solid.is-hover {
          opacity: 0.9;
          box-shadow: 0 0 16px rgba(255, 255, 255, 0.2);
        }
        .preview-pill-solid:focus-visible, .preview-pill-solid.is-focus {
          outline: 2px solid #00E5FF;
          outline-offset: 3px;
        }
        .preview-pill-solid:active, .preview-pill-solid.is-active {
          transform: translateY(1px);
          opacity: 0.8;
        }
        .preview-pill-solid:disabled, .preview-pill-solid[aria-disabled="true"] {
          opacity: 0.45;
          cursor: not-allowed;
          background: #8E9BAE;
          border-color: #8E9BAE;
          color: #000000;
        }
        .preview-pill-solid[data-state="loading"] {
          pointer-events: none;
          opacity: 0.85;
        }
        .preview-pill-solid[data-state="error"] {
          background: #FF5252;
          border-color: #FF5252;
          color: #FFFFFF;
        }
        .preview-pill-solid[data-state="success"] {
          background: #00FF9D;
          border-color: #00FF9D;
          color: #000000;
        }
      `}</style>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0' }}>Top Bar Navigation — 8 States Preview</h1>
        <p style={{ color: '#8E9BAE', fontSize: '14px', margin: '0' }}>
          Demonstrating all 8 mandatory Hallmark interaction states for top bar navigation triggers and action buttons.
        </p>
      </div>

      {/* SECTION 1: NAV LINK / DROPDOWN TRIGGERS */}
      <div className="preview-section">
        <h2 className="preview-title">1. Dropdown Link Triggers (.lp-nav__link-btn)</h2>
        <div className="preview-grid">
          
          <div className="preview-card">
            <span className="state-label">1. Default</span>
            <div className="state-element-wrap">
              <button className="preview-btn-nav">Platform <ChevronDown size={14} /></button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">2. Hover (.is-hover)</span>
            <div className="state-element-wrap">
              <button className="preview-btn-nav is-hover">Platform <ChevronDown size={14} /></button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">3. Focus (.is-focus)</span>
            <div className="state-element-wrap">
              <button className="preview-btn-nav is-focus">Platform <ChevronDown size={14} /></button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">4. Active / Pressed (.is-active)</span>
            <div className="state-element-wrap">
              <button className="preview-btn-nav is-active">Platform <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /></button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">5. Disabled</span>
            <div className="state-element-wrap">
              <button className="preview-btn-nav" aria-disabled="true" disabled>Platform <ChevronDown size={14} /></button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">6. Loading</span>
            <div className="state-element-wrap">
              <button className="preview-btn-nav" aria-disabled="true">
                Platform <Loader2 size={14} className="animate-spin" />
              </button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">7. Error</span>
            <div className="state-element-wrap">
              <button className="preview-btn-nav" style={{ color: '#FF5252' }}>
                Platform <AlertCircle size={14} />
              </button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">8. Success</span>
            <div className="state-element-wrap">
              <button className="preview-btn-nav" style={{ color: '#00FF9D' }}>
                Platform <CheckCircle2 size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: GHOST PILL BUTTON (LOG IN) */}
      <div className="preview-section">
        <h2 className="preview-title">2. Ghost Action Pill (.lp-btn--pill-ghost)</h2>
        <div className="preview-grid">
          
          <div className="preview-card">
            <span className="state-label">1. Default</span>
            <div className="state-element-wrap">
              <button className="preview-pill-ghost">Log in</button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">2. Hover (.is-hover)</span>
            <div className="state-element-wrap">
              <button className="preview-pill-ghost is-hover">Log in</button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">3. Focus (.is-focus)</span>
            <div className="state-element-wrap">
              <button className="preview-pill-ghost is-focus">Log in</button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">4. Active / Pressed (.is-active)</span>
            <div className="state-element-wrap">
              <button className="preview-pill-ghost is-active">Log in</button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">5. Disabled</span>
            <div className="state-element-wrap">
              <button className="preview-pill-ghost" aria-disabled="true" disabled>Log in</button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">6. Loading</span>
            <div className="state-element-wrap">
              <button className="preview-pill-ghost" data-state="loading" aria-disabled="true">
                <Loader2 size={14} className="animate-spin" /> Verifying...
              </button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">7. Error</span>
            <div className="state-element-wrap">
              <button className="preview-pill-ghost" data-state="error">
                <AlertCircle size={14} /> Failed
              </button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">8. Success</span>
            <div className="state-element-wrap">
              <button className="preview-pill-ghost" data-state="success">
                <CheckCircle2 size={14} /> Welcome
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3: SOLID PILL BUTTON (BOOK A DEMO) */}
      <div className="preview-section">
        <h2 className="preview-title">3. Solid Action Pill (.lp-btn--pill-solid)</h2>
        <div className="preview-grid">
          
          <div className="preview-card">
            <span className="state-label">1. Default</span>
            <div className="state-element-wrap">
              <button className="preview-pill-solid">Book a demo</button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">2. Hover (.is-hover)</span>
            <div className="state-element-wrap">
              <button className="preview-pill-solid is-hover">Book a demo</button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">3. Focus (.is-focus)</span>
            <div className="state-element-wrap">
              <button className="preview-pill-solid is-focus">Book a demo</button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">4. Active / Pressed (.is-active)</span>
            <div className="state-element-wrap">
              <button className="preview-pill-solid is-active">Book a demo</button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">5. Disabled</span>
            <div className="state-element-wrap">
              <button className="preview-pill-solid" aria-disabled="true" disabled>Book a demo</button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">6. Loading</span>
            <div className="state-element-wrap">
              <button className="preview-pill-solid" data-state="loading" aria-disabled="true">
                <Loader2 size={14} className="animate-spin" /> Scheduling...
              </button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">7. Error</span>
            <div className="state-element-wrap">
              <button className="preview-pill-solid" data-state="error">
                <AlertCircle size={14} /> Retry
              </button>
            </div>
          </div>

          <div className="preview-card">
            <span className="state-label">8. Success</span>
            <div className="state-element-wrap">
              <button className="preview-pill-solid" data-state="success">
                <CheckCircle2 size={14} /> Booked!
              </button>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
};
