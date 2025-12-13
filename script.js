(function () {
  const titleInput = document.getElementById('title-input');
  const documentclassSelect = document.getElementById('documentclass-select');
  const optTwocolumn = document.getElementById('opt-twocolumn');
  const optOneside = document.getElementById('opt-oneside');
  const optOpenany = document.getElementById('opt-openany');
  const optLandscape = document.getElementById('opt-landscape');
  const tocCheckbox = document.getElementById('toc-checkbox');
  const papersizeSelect = document.getElementById('papersize-select');
  const fontsizeSelect = document.getElementById('fontsize-select');
  const marginInput = document.getElementById('margin-input');

  const yamlOutput = document.getElementById('yaml-output');
  const copyButton = document.getElementById('copy-button');
  const copyStatus = document.getElementById('copy-status');
  const resetButton = document.getElementById('reset-button');

  const DEFAULTS = {
    title: '',
    documentclass: 'article',
    classoptions: [],
    toc: true,
    papersize: 'a4',
    fontsize: '12pt',
    margin: '1.5cm',
  };

  function getSelectedClassoptions() {
    const options = [];
    if (optLandscape && optLandscape.checked) options.push('landscape');
    if (optTwocolumn.checked) options.push('twocolumn');
    if (optOneside.checked) options.push('oneside');
    if (optOpenany.checked) options.push('openany');
    // Sort options alphabetically to provide stable, predictable output
    return options.sort();
  }

  // Return a sorted shallow copy of an array of strings. Non-strings are coerced to strings.
  function sortedCopy(arr) {
    if (!Array.isArray(arr)) return arr;
    return arr.slice().map((v) => String(v)).sort();
  }

  function escapeYamlSingleQuoted(str) {
    return str.replace(/'/g, "''");
  }

  function buildYaml() {
    const lines = [];
    lines.push('---');

    const rawTitle = titleInput.value.trim();
    const useTitle = rawTitle.length > 0;
    if (useTitle) {
      const escaped = escapeYamlSingleQuoted(rawTitle);
      lines.push("title: '" + escaped + "'");
    }

    const documentclass = documentclassSelect.value || DEFAULTS.documentclass;
    lines.push('documentclass: ' + documentclass);

    const classoptions = getSelectedClassoptions();
    if (classoptions.length > 0) {
      lines.push('classoption:');
      // Emit classoptions in sorted order for stable YAML output
      sortedCopy(classoptions).forEach((opt) => {
        lines.push('- ' + opt);
      });
    }

    if (tocCheckbox.checked) {
      lines.push('toc: true');
    }

    const papersize = papersizeSelect.value || DEFAULTS.papersize;
    lines.push('papersize: ' + papersize);

    const fontsize = fontsizeSelect.value || DEFAULTS.fontsize;
    lines.push('fontsize: ' + fontsize);

    const margin = marginInput.value.trim();
    const geometryLines = [];
    if (margin.length > 0) {
      geometryLines.push('margin=' + margin);
    }
    if (documentclass === 'book') {
      geometryLines.push('includeheadfoot');
    } else {
      geometryLines.push('includefoot');
    }

    if (geometryLines.length > 0) {
      lines.push('geometry:');
      // Emit geometry flags in sorted order to keep arrays deterministic
      sortedCopy(geometryLines).forEach((g) => {
        lines.push('- ' + g);
      });
    }

    lines.push('---');

    // Ensure the YAML output always ends with exactly three newlines.
    // Build the base YAML string (no trailing newlines), then append three newlines.
    const baseYaml = lines.join('\n');
    const finalYaml = baseYaml + '\n\n\n';
    yamlOutput.textContent = finalYaml;
  }

  function resetToDefaults() {
    titleInput.value = DEFAULTS.title;

    documentclassSelect.value = DEFAULTS.documentclass;

    optTwocolumn.checked = DEFAULTS.classoptions.includes('twocolumn');
    optOneside.checked = DEFAULTS.classoptions.includes('oneside');
    optOpenany.checked = DEFAULTS.classoptions.includes('openany');
    if (optLandscape) optLandscape.checked = DEFAULTS.classoptions.includes('landscape');

    tocCheckbox.checked = DEFAULTS.toc;
    papersizeSelect.value = DEFAULTS.papersize;
    fontsizeSelect.value = DEFAULTS.fontsize;
    marginInput.value = DEFAULTS.margin;

    buildYaml();
  }

  function attachListeners() {
    [
      titleInput,
      documentclassSelect,
      optTwocolumn,
      optOneside,
      optOpenany,
      optLandscape,
      tocCheckbox,
      papersizeSelect,
      fontsizeSelect,
      marginInput,
    ].forEach((el) => {
      el.addEventListener('input', buildYaml);
      el.addEventListener('change', buildYaml);
    });

    resetButton.addEventListener('click', function () {
      resetToDefaults();
    });

    copyButton.addEventListener('click', function () {
      const text = yamlOutput.textContent || '';
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        // Fallback: use a hidden textarea to reliably copy the exact text (including trailing newlines).
        const ta = document.createElement('textarea');
        ta.value = text;
        // Prevent flashing and keep it out of flow
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.setAttribute('aria-hidden', 'true');
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          showCopyStatus('Copied to clipboard (fallback).');
        } catch (e) {
          showCopyStatus('Select the text and copy manually.');
        }
        document.body.removeChild(ta);
        return;
      }

      navigator.clipboard
        .writeText(text)
        .then(function () {
          showCopyStatus('Copied to clipboard.');
        })
        .catch(function () {
          showCopyStatus('Could not copy. Select the text and copy manually.');
        });
    });
  }

  let copyStatusTimeoutId = null;
  function showCopyStatus(message) {
    copyStatus.textContent = message;
    if (copyStatusTimeoutId !== null) {
      clearTimeout(copyStatusTimeoutId);
    }
    copyStatusTimeoutId = setTimeout(function () {
      copyStatus.textContent = '';
      copyStatusTimeoutId = null;
    }, 2500);
  }

  function init() {
    titleInput.value = DEFAULTS.title;
    documentclassSelect.value = DEFAULTS.documentclass;
    optTwocolumn.checked = DEFAULTS.classoptions.includes('twocolumn');
    optOneside.checked = DEFAULTS.classoptions.includes('oneside');
    optOpenany.checked = DEFAULTS.classoptions.includes('openany');
    if (optLandscape) optLandscape.checked = DEFAULTS.classoptions.includes('landscape');
    tocCheckbox.checked = DEFAULTS.toc;
    papersizeSelect.value = DEFAULTS.papersize;
    fontsizeSelect.value = DEFAULTS.fontsize;
    marginInput.value = DEFAULTS.margin;

    attachListeners();
    buildYaml();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
