<Route
  path="/admin/test-runner"
  element={
    <React.Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
      <TestRunnerPage />
    </React.Suspense>
  }
/>
