if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    if (window.AppCore?.initLivePage) {
      window.AppCore.initLivePage({
        onAnalyze: (symbol) => {
          const url = window.AppCore.buildAnalyzeUrl(symbol, { autoRun: true });
          window.location.href = url;
        },
      });
    }
  });
}
