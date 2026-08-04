
/*
=========================================
SETTINGS
=========================================
*/

// ====================
// COMPONENTS
// ====================

export default function SettingsPage() {
  
  // ====================
  // PAGE LAYOUT
  // ====================

  return (
    <main className="app-page">
      <div className="app-container-narrow">
        <section className="app-header">
          <div>
          <p className="app-eyebrow">
            Studio Settings
          </p>

          <h1 className="app-title">
            Settings
          </h1>

          <p className="app-subtitle">
            Future home for studio preferences, staff workflow, and app defaults.
          </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="app-panel-pad">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Studio Info
            </h2>

            <p className="text-slate-500">
              Studio name, contact info, address, and receipt details can go here later.
            </p>
          </div>

          <div className="app-panel-pad">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Workflow Defaults
            </h2>

            <p className="text-slate-500">
              Staff profiles, job statuses, due date rules, and archive behavior can live here.
            </p>
          </div>

          <div className="app-panel-pad">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Intake Rules
            </h2>

            <p className="text-slate-500">
              Required fields, phone formatting, description limits, and project type options.
            </p>
          </div>

          <div className="app-panel-pad">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Calendar
            </h2>

            <p className="text-slate-500">
              Studio hours, closed days, appointment lengths, and scheduling defaults.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
