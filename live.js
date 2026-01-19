if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const autoRunToggle = document.getElementById("auto-run-toggle");
    if (window.AppCore?.initLivePage) {
      window.AppCore.initLivePage({
        onAnalyze: (symbol) => {
          const autoRun = autoRunToggle?.checked ?? true;
          const url = window.AppCore.buildAnalyzeUrl(symbol, { autoRun });
          window.location.assign(url);
        },
      });
    }
  });
}
