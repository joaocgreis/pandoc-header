(function () {
  const titleInput = document.getElementById('title-input');
  const subtitleInput = document.getElementById('subtitle-input');
  const dateInput = document.getElementById('date-input');
  const authorsContainer = document.getElementById('authors-container');
  const documentclassSelect = document.getElementById('documentclass-select');
  const optLandscape = document.getElementById('opt-landscape');
  const optOneside = document.getElementById('opt-oneside');
  const optOpenany = document.getElementById('opt-openany');
  const optTwocolumn = document.getElementById('opt-twocolumn');
  const tocCheckbox = document.getElementById('toc-checkbox');
  const tocExtra = document.getElementById('toc-extra');
  const tocTitleInput = document.getElementById('toc-title-input');
  const tocDepthInput = document.getElementById('toc-depth-input');
  const papersizeSelect = document.getElementById('papersize-select');
  const fontsizeSelect = document.getElementById('fontsize-select');
  const marginInput = document.getElementById('margin-input');
  const optFallbacks = document.getElementById('opt-fallbacks');
  const optFallbacksCJK = document.getElementById('opt-fallbacks-cjk');
  const emptypageCheckbox = document.getElementById('emptypage-checkbox');
  const mainfontSelect = document.getElementById('mainfont-select');
  const sansfontSelect = document.getElementById('sansfont-select');
  const monofontSelect = document.getElementById('monofont-select');
  const linksAsNotesCheckbox = document.getElementById('links-as-notes-checkbox');
  const nowidowCheckbox = document.getElementById('nowidow-checkbox');
  const fvextraCheckbox = document.getElementById('fvextra-checkbox');
  const framedCheckbox = document.getElementById('framed-checkbox');
  const sloppyCheckbox = document.getElementById('sloppy-checkbox');
  const disableUnderfullHboxCheckbox = document.getElementById('disable-underfull-hbox-checkbox');
  const titlesecCompactCheckbox = document.getElementById('titlesec-compact-checkbox');
  const sectionNewPageCheckbox = document.getElementById('section-new-page-checkbox');
  const tocTwocolumnCheckbox = document.getElementById('toc-twocolumn-checkbox');

  const yamlOutput = document.getElementById('yaml-output');
  const copyButton = document.getElementById('copy-button');
  const copyStatus = document.getElementById('copy-status');
  const resetButton = document.getElementById('reset-button');

  const MONO_FONT = 'Noto Sans Mono';
  const sansFonts = [
    'Noto Sans',
    MONO_FONT,
  ];
  const serifFonts = [
    'Noto Serif',
    'EB Garamond',
  ];
  const sortedFonts = serifFonts.concat(sansFonts).sort();

  const DEFAULTS = {
    title: '',
    subtitle: '',
    date: '',
    authors: [],
    documentclass: 'article',
    classoptions: [],
    toc: false,
    tocTitle: '',
    tocDepth: '',
    papersize: 'a4',
    fontsize: '12pt',
    margin: '1.5cm',
    emptypage: true,
    fallbacks: true,
    fallbacksCJK: false,
    mainfont: 'Noto Serif',
    sansfont: 'Noto Sans',
    monofont: 'Noto Sans Mono',
    linksAsNotes: true,
    nowidow: true,
    fvextra: true,
    framed: false,
    sloppy: false,
    disableUnderfullHbox: false,
    titlesecCompact: false,
    sectionNewPage: false,
    tocTwocolumn: false,
  };

  // Enable or disable specific options in the UI. We remove them
  // from the document flow (display: none) rather than disabling them.
  function updateAll() {
    const isBook = (documentclassSelect.value || DEFAULTS.documentclass) === 'book';
    // The inputs are wrapped in <label class="checkbox-label">; hide that label
    // so the checkbox and its text disappear from the flow.
    const labelOneside = optOneside.closest('.checkbox-label') || optOneside.parentElement;
    if (labelOneside && labelOneside.style) labelOneside.style.display = isBook ? '' : 'none';
    const labelOpenany = optOpenany.closest('.checkbox-label') || optOpenany.parentElement;
    if (labelOpenany && labelOpenany.style) labelOpenany.style.display = isBook ? '' : 'none';
    // Show or hide toc-twocolumn checkbox depending on twocolumn option
    const isTwocolumn = optTwocolumn.checked;
    const labelTocTwocolumn = tocTwocolumnCheckbox.closest('.checkbox-label') || tocTwocolumnCheckbox.parentElement;
    if (labelTocTwocolumn && labelTocTwocolumn.style) labelTocTwocolumn.style.display = isTwocolumn ? '' : 'none';

    // Show or hide the toc extra inputs depending on the toc checkbox state
    const isTocEnabled = tocCheckbox.checked;
    tocExtra.style.display = isTocEnabled ? '' : 'none';

    // Turn tocDepthInput red if the value is invalid (non-digit)
    const depthRaw = tocDepthInput && tocDepthInput.value.trim();
    if (depthRaw && !/^\d*$/.test(depthRaw)) {
      tocDepthInput.classList.add('input-invalid');
    } else {
      tocDepthInput.classList.remove('input-invalid');
    }

    yamlOutput.textContent = buildYaml();
  }

  function buildYaml() {
    const lines = [];
    lines.push('---');

    const rawTitle = titleInput.value.trim();
    if (rawTitle.length > 0) {
      const escaped = escapeYamlSingleQuoted(rawTitle);
      lines.push("title: '" + escaped + "'");
    }

    const rawSubtitle = subtitleInput.value.trim();
    if (rawSubtitle.length > 0) {
      const escapedSub = escapeYamlSingleQuoted(rawSubtitle);
      lines.push("subtitle: '" + escapedSub + "'");
    }

    const rawDate = dateInput.value.trim();
    if (rawDate && rawDate.length > 0) {
      const escapedDate = escapeYamlSingleQuoted(rawDate);
      lines.push("date: '" + escapedDate + "'");
    }

    const authors = getAuthorValues();
    if (authors.length === 1) {
      const escapedAuthor = escapeYamlSingleQuoted(authors[0]);
      lines.push("author: '" + escapedAuthor + "'");
    } else if (authors.length > 0) {
      lines.push('author:');
      // Emit authors in the order specified by the user
      authors.forEach((a) => {
        const escaped = escapeYamlSingleQuoted(a);
        lines.push("- '" + escaped + "'");
      });
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
      // Emit optional toc-title and toc-depth immediately after toc
      const ttl = tocTitleInput && tocTitleInput.value.trim();
      if (ttl && ttl.length > 0) {
        const escaped = escapeYamlSingleQuoted(ttl);
        lines.push("toc-title: '" + escaped + "'");
      }
      const depthRaw = tocDepthInput && tocDepthInput.value.trim();
      // Allow only digits for depth; ignore otherwise
      if (depthRaw && /^\d+$/.test(depthRaw)) {
        lines.push('toc-depth: ' + depthRaw);
      }
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

    if (linksAsNotesCheckbox.checked) {
      lines.push('links-as-notes: true');
    }

    const headerIncludes = [];
    if (emptypageCheckbox.checked) {
      headerIncludes.push("- '`\\usepackage{emptypage}`{=latex}' # Do not print page numbers and headings on empty pages");
    }
    if (fvextraCheckbox.checked) {
      headerIncludes.push("- | # Improved code blocks (requires highlighting language to be specified)\n  ```{=latex}\n  \\usepackage{fvextra}\n  \\fvset{breaklines}\n  \\fvset{breaknonspaceingroup}\n  \\fvset{breakanywhere}\n  ```");
    }
    if (framedCheckbox.checked) {
      headerIncludes.push("- | # Show frames around code blocks\n  ```{=latex}\n  \\usepackage{framed}\n  \\renewenvironment{Shaded}{\\begin{oframed}}{\\end{oframed}}\n  ```");
    }
    if (nowidowCheckbox.checked) {
      headerIncludes.push("- '`\\usepackage[all]{nowidow}`{=latex}' # Avoid widow and orphan lines");
    }
    if (sloppyCheckbox.checked) {
      headerIncludes.push("- '`\\sloppy`{=latex}' # Allow a lot of space between words for better alignment");
    }
    if (disableUnderfullHboxCheckbox.checked) {
      headerIncludes.push("- '`\\hbadness=99999`{=latex}' # Disable Underfull hbox warnings");
    }
    if (titlesecCompactCheckbox.checked) {
      headerIncludes.push("- '`\\usepackage[compact]{titlesec}`{=latex}' # Make headings take less space");
    }
    if (sectionNewPageCheckbox.checked) {
      headerIncludes.push("- '`\\newcommand{\\sectionbreak}{\\clearpage}`{=latex}' # Start a new page with each section");
    }
    const isTwocolumn = optTwocolumn.checked;
    if (isTwocolumn && tocTwocolumnCheckbox.checked) {
      headerIncludes.push("- | # Make toc in twocolumn mode\n  ```{=latex}\n  \\makeatletter\n  \\renewcommand\\tableofcontents{%\n    \\chapter*{\\contentsname\n      \\@mkboth{%\n        \\MakeUppercase\\contentsname}{\\MakeUppercase\\contentsname}}%\n    \\@starttoc{toc}%\n  }\n  \\makeatother\n  ```");
    }
    if (headerIncludes.length > 0) {
      lines.push('header-includes:');
      // Emit header-includes in sorted order for stability
      sortedCopy(headerIncludes).forEach((h) => {
        lines.push(h);
      });
    }

    const mainfont = mainfontSelect.value && mainfontSelect.value.trim();
    if (mainfont && mainfont.length > 0) addFont('main', mainfont, lines);
    const sansfont = sansfontSelect.value && sansfontSelect.value.trim();
    if (sansfont && sansfont.length > 0) addFont('sans', sansfont, lines);
    const monofont = monofontSelect.value && monofontSelect.value.trim();
    if (monofont && monofont.length > 0) addFont('mono', monofont, lines);

    lines.push('---');

    // Ensure the YAML output always ends with exactly three newlines.
    const finalYaml = lines.join('\n') + '\n\n\n';
    return finalYaml;
  }
  function sortedCopy(arr) {
    // Return a sorted shallow copy of an array of strings. Non-strings are coerced to strings.
    if (!Array.isArray(arr)) return arr;
    return arr.slice().map((v) => String(v)).sort();
  }
  function escapeYamlSingleQuoted(str) {
    return str.replace(/'/g, "''");
  }
  function getSelectedClassoptions() {
    const options = [];
    if (optLandscape.checked) options.push('landscape');
    if (optTwocolumn.checked) options.push('twocolumn');
    // Only include 'oneside' and 'openany' when the documentclass is 'book'
    const documentclass = documentclassSelect.value || DEFAULTS.documentclass;
    if (documentclass === 'book') {
      if (optOneside.checked) options.push('oneside');
      if (optOpenany.checked) options.push('openany');
    }
    // Sort options alphabetically to provide stable, predictable output
    return options.sort();
  }
  function addFont(fontType, fontName, lines) {
    const escaped = escapeYamlSingleQuoted(fontName);
    lines.push(fontType + "font: '" + escaped + "'");

    const addFallbacks = optFallbacks.checked;
    const addFallbacksCJK = optFallbacksCJK.checked;
    if (addFallbacks || addFallbacksCJK) {
      lines.push(fontType + 'fontfallback:');
    }
    if (addFallbacks) {
      lines.push('- "NotoColorEmoji:mode=harf"');
      lines.push('- "NotoSansMath:mode=harf"');
      lines.push('- "NotoSansSymbols:mode=harf"');
      lines.push('- "NotoSansSymbols2:mode=harf"');
    }
    if (addFallbacksCJK) {
      if (serifFonts.includes(fontName)) {
        lines.push('- "Noto Serif CJK JP:mode=harf"');
      } else {
        lines.push('- "Noto Sans CJK JP:mode=harf"');
      }
    }

    if (fontName === MONO_FONT) {
      lines.push(fontType + 'fontoptions:');
      lines.push("- '`AutoFakeSlant,BoldItalicFeatures={FakeSlant}`{=latex}'");
    }
  }

  function resetToDefaults() {
    titleInput.value = DEFAULTS.title;
    subtitleInput.value = DEFAULTS.subtitle;
    dateInput.value = DEFAULTS.date;
    // Reset authors: clear container and add a single empty input
    authorsContainer.innerHTML = '';
    addAuthorInput('');

    documentclassSelect.value = DEFAULTS.documentclass;
    optLandscape.checked = DEFAULTS.classoptions.includes('landscape');
    optOneside.checked = DEFAULTS.classoptions.includes('oneside');
    optOpenany.checked = DEFAULTS.classoptions.includes('openany');
    optTwocolumn.checked = DEFAULTS.classoptions.includes('twocolumn');

    tocCheckbox.checked = DEFAULTS.toc;
    tocTitleInput.value = DEFAULTS.tocTitle;
    tocDepthInput.value = DEFAULTS.tocDepth;

    papersizeSelect.value = DEFAULTS.papersize;

    fontsizeSelect.value = DEFAULTS.fontsize;

    marginInput.value = DEFAULTS.margin;

    emptypageCheckbox.checked = DEFAULTS.emptypage;
    optFallbacks.checked = DEFAULTS.fallbacks;
    optFallbacksCJK.checked = DEFAULTS.fallbacksCJK;
    mainfontSelect.value = DEFAULTS.mainfont;
    sansfontSelect.value = DEFAULTS.sansfont;
    monofontSelect.value = DEFAULTS.monofont;

    linksAsNotesCheckbox.checked = DEFAULTS.linksAsNotes;
    nowidowCheckbox.checked = DEFAULTS.nowidow;
    fvextraCheckbox.checked = DEFAULTS.fvextra;
    framedCheckbox.checked = DEFAULTS.framed;
    sloppyCheckbox.checked = DEFAULTS.sloppy;
    disableUnderfullHboxCheckbox.checked = DEFAULTS.disableUnderfullHbox;
    titlesecCompactCheckbox.checked = DEFAULTS.titlesecCompact;
    sectionNewPageCheckbox.checked = DEFAULTS.sectionNewPage;
    tocTwocolumnCheckbox.checked = DEFAULTS.tocTwocolumn;

    updateAll();
  }

  // Dynamic authors input handling
  let authorInputCounter = 0;
  function addAuthorInput(initialValue) {
    const idx = authorInputCounter++;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'field-multi-input';
    input.id = 'field-multi-input-' + idx;
    input.placeholder = 'e.g. First Last';
    input.value = initialValue || '';

    input.addEventListener('input', function () {
      updateAll();
      // If this is the last input and it's non-empty, append a new empty input
      const all = Array.from(authorsContainer.querySelectorAll('.field-multi-input'));
      if (all.length && all[all.length - 1] === input && input.value.trim().length > 0) {
        addAuthorInput('');
      }
    });

    input.addEventListener('blur', function () {
      // If input is empty on blur and this is not the last input, remove it
      const val = input.value.trim();
      const all = Array.from(authorsContainer.querySelectorAll('.field-multi-input'));
      if (all.length && all[all.length - 1] !== input && val.length === 0) {
        // remove the element
        authorsContainer.removeChild(input);
        updateAll();
      }
    });

    authorsContainer.appendChild(input);
    return input;
  }

  function getAuthorValues() {
    return Array
      .from(authorsContainer.querySelectorAll('.field-multi-input'))
      .map((i) => (i.value || '').trim())
      .filter((v) => v.length > 0);
  }

  function copyToClipboard() {
    const text = yamlOutput.textContent || '';

    // Fallback: use a hidden textarea to reliably copy the exact text (including trailing newlines).
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
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

  function attachListeners() {
    [
      titleInput,
      subtitleInput,
      dateInput,
      documentclassSelect,
      optLandscape,
      optOneside,
      optOpenany,
      optTwocolumn,
      tocCheckbox,
      tocTitleInput,
      tocDepthInput,
      papersizeSelect,
      fontsizeSelect,
      marginInput,
      emptypageCheckbox,
      optFallbacks,
      optFallbacksCJK,
      mainfontSelect,
      sansfontSelect,
      monofontSelect,
      linksAsNotesCheckbox,
      nowidowCheckbox,
      fvextraCheckbox,
      framedCheckbox,
      sloppyCheckbox,
      disableUnderfullHboxCheckbox,
      titlesecCompactCheckbox,
      sectionNewPageCheckbox,
      tocTwocolumnCheckbox,
    ].forEach((el) => {
      el.addEventListener('input', updateAll);
      el.addEventListener('change', updateAll);
    });
    resetButton.addEventListener('click', resetToDefaults);
    copyButton.addEventListener('click', copyToClipboard);
  }

  function initFonts() {
    [
      mainfontSelect,
      sansfontSelect,
      monofontSelect,
    ].forEach((fontSelect) => {
      const unsetOption = document.createElement('option');
      unsetOption.value = '';
      unsetOption.textContent = '(unset)';
      fontSelect.appendChild(unsetOption);
      sortedFonts.forEach((fontName) => {
        const option = document.createElement('option');
        option.value = fontName;
        option.textContent = fontName;
        fontSelect.appendChild(option);
      });
    });
  }

  function init() {
    initFonts();
    attachListeners();
    resetToDefaults();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
