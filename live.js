if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const autoRunToggle = document.getElementById("auto-run-toggle");
    if (window.AppCore?.initLivePage) {
      window.AppCore.initLivePage({
        onAnalyze: (symbol) => {
          if (window.AppCore?.openSignalDrawer) {
            window.AppCore.openSignalDrawer(symbol);
          } else {
            const autoRun = autoRunToggle?.checked ?? true;
            const url = window.AppCore.buildAnalyzeUrl(symbol, { autoRun });
            window.location.href = url;
          }
        },
      });
    }
  });
}
