/**
 * Pandoc YAML Header Builder
 *
 * Organized into sections:
 * 1. Configuration (fonts, defaults, field registry, header-includes registry)
 * 2. DOM Element References
 * 3. Utility Functions
 * 4. YAML Building Functions
 * 5. UI Management Functions
 * 6. Authors Handling
 * 7. Clipboard Functions
 * 8. Initialization
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. CONFIGURATION
     ========================================================================== */

  // Font Configuration
  const MONO_FONT = 'Noto Sans Mono';

  const FONT_CONFIG = {
    serif: ['Noto Serif', 'EB Garamond'],
    sans: ['Noto Sans', MONO_FONT],
  };

  const SORTED_FONTS = FONT_CONFIG.serif.concat(FONT_CONFIG.sans).sort();

  const FONT_FALLBACKS = {
    standard: [
      'NotoColorEmoji:mode=harf',
      'NotoSansMath:mode=harf',
      'NotoSansSymbols:mode=harf',
      'NotoSansSymbols2:mode=harf',
    ],
    cjkSerif: 'Noto Serif CJK JP:mode=harf',
    cjkSans: 'Noto Sans CJK JP:mode=harf',
  };

  // Default values for all form fields
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

  /**
   * Field Registry - defines all form fields with their types, IDs, and default keys.
   * This makes it easy to add new fields: just add an entry here and handle it in buildYaml.
   *
   * Field types: 'text', 'select', 'checkbox'
   */
  const FIELD_REGISTRY = [
    // Metadata fields
    { id: 'title-input', type: 'text', defaultKey: 'title' },
    { id: 'subtitle-input', type: 'text', defaultKey: 'subtitle' },
    { id: 'date-input', type: 'text', defaultKey: 'date' },

    // Document class and options
    { id: 'documentclass-select', type: 'select', defaultKey: 'documentclass' },
    { id: 'opt-landscape', type: 'checkbox', defaultKey: 'classoptions', classoptionValue: 'landscape' },
    { id: 'opt-oneside', type: 'checkbox', defaultKey: 'classoptions', classoptionValue: 'oneside' },
    { id: 'opt-openany', type: 'checkbox', defaultKey: 'classoptions', classoptionValue: 'openany' },
    { id: 'opt-twocolumn', type: 'checkbox', defaultKey: 'classoptions', classoptionValue: 'twocolumn' },

    // Table of contents
    { id: 'toc-checkbox', type: 'checkbox', defaultKey: 'toc' },
    { id: 'toc-title-input', type: 'text', defaultKey: 'tocTitle' },
    { id: 'toc-depth-input', type: 'text', defaultKey: 'tocDepth' },

    // Page settings
    { id: 'papersize-select', type: 'select', defaultKey: 'papersize' },
    { id: 'fontsize-select', type: 'select', defaultKey: 'fontsize' },
    { id: 'margin-input', type: 'text', defaultKey: 'margin' },

    // Font settings
    { id: 'mainfont-select', type: 'select', defaultKey: 'mainfont' },
    { id: 'sansfont-select', type: 'select', defaultKey: 'sansfont' },
    { id: 'monofont-select', type: 'select', defaultKey: 'monofont' },
    { id: 'opt-fallbacks', type: 'checkbox', defaultKey: 'fallbacks' },
    { id: 'opt-fallbacks-cjk', type: 'checkbox', defaultKey: 'fallbacksCJK' },

    // Style options
    { id: 'emptypage-checkbox', type: 'checkbox', defaultKey: 'emptypage' },
    { id: 'links-as-notes-checkbox', type: 'checkbox', defaultKey: 'linksAsNotes' },
    { id: 'nowidow-checkbox', type: 'checkbox', defaultKey: 'nowidow' },
    { id: 'fvextra-checkbox', type: 'checkbox', defaultKey: 'fvextra' },
    { id: 'framed-checkbox', type: 'checkbox', defaultKey: 'framed' },
    { id: 'sloppy-checkbox', type: 'checkbox', defaultKey: 'sloppy' },
    { id: 'disable-underfull-hbox-checkbox', type: 'checkbox', defaultKey: 'disableUnderfullHbox' },
    { id: 'titlesec-compact-checkbox', type: 'checkbox', defaultKey: 'titlesecCompact' },
    { id: 'section-new-page-checkbox', type: 'checkbox', defaultKey: 'sectionNewPage' },
    { id: 'toc-twocolumn-checkbox', type: 'checkbox', defaultKey: 'tocTwocolumn' },
  ];

  /**
   * Header Includes Registry - defines all header-includes options.
   * Each entry maps a checkbox ID to its YAML output.
   *
   * Types:
   * - 'simple': Single-line usepackage or command
   * - 'multiline': Multi-line LaTeX block
   * - 'conditional': Requires additional condition to be included
   */
  const HEADER_INCLUDES_REGISTRY = [
    {
      id: 'emptypage-checkbox',
      type: 'simple',
      yaml: "- '`\\usepackage{emptypage}`{=latex}' # Do not print page numbers and headings on empty pages",
    },
    {
      id: 'fvextra-checkbox',
      type: 'multiline',
      yaml: "- | # Improved code blocks (requires highlighting language to be specified)\n  ```{=latex}\n  \\usepackage{fvextra}\n  \\fvset{breaklines}\n  \\fvset{breaknonspaceingroup}\n  \\fvset{breakanywhere}\n  ```",
    },
    {
      id: 'framed-checkbox',
      type: 'multiline',
      yaml: "- | # Show frames around code blocks\n  ```{=latex}\n  \\usepackage{framed}\n  \\renewenvironment{Shaded}{\\begin{oframed}}{\\end{oframed}}\n  ```",
    },
    {
      id: 'nowidow-checkbox',
      type: 'simple',
      yaml: "- '`\\usepackage[all]{nowidow}`{=latex}' # Avoid widow and orphan lines",
    },
    {
      id: 'sloppy-checkbox',
      type: 'simple',
      yaml: "- '`\\sloppy`{=latex}' # Allow a lot of space between words for better alignment",
    },
    {
      id: 'disable-underfull-hbox-checkbox',
      type: 'simple',
      yaml: "- '`\\hbadness=99999`{=latex}' # Disable Underfull hbox warnings",
    },
    {
      id: 'titlesec-compact-checkbox',
      type: 'simple',
      yaml: "- '`\\usepackage[compact]{titlesec}`{=latex}' # Make headings take less space",
    },
    {
      id: 'section-new-page-checkbox',
      type: 'simple',
      yaml: "- '`\\newcommand{\\sectionbreak}{\\clearpage}`{=latex}' # Start a new page with each section",
    },
    {
      id: 'toc-twocolumn-checkbox',
      type: 'conditional',
      condition: () => elements.optTwocolumn.checked,
      yaml: "- | # Make toc in twocolumn mode\n  ```{=latex}\n  \\makeatletter\n  \\renewcommand\\tableofcontents{%\n    \\chapter*{\\contentsname\n      \\@mkboth{%\n        \\MakeUppercase\\contentsname}{\\MakeUppercase\\contentsname}}%\n    \\@starttoc{toc}%\n  }\n  \\makeatother\n  ```",
    },
  ];

  /**
   * Visibility Rules - defines when elements should be shown/hidden.
   * Each rule has a target element and a condition function.
   */
  const VISIBILITY_RULES = [
    {
      targetId: 'opt-oneside',
      useLabel: true,
      condition: () => elements.documentclassSelect.value === 'book',
    },
    {
      targetId: 'opt-openany',
      useLabel: true,
      condition: () => elements.documentclassSelect.value === 'book',
    },
    {
      targetId: 'toc-twocolumn-checkbox',
      useLabel: true,
      condition: () => elements.optTwocolumn.checked,
    },
    {
      targetId: 'toc-extra',
      useLabel: false,
      condition: () => elements.tocCheckbox.checked,
    },
  ];

  /**
   * Validation Rules - defines input validation.
   */
  const VALIDATION_RULES = [
    {
      targetId: 'toc-depth-input',
      validate: (el) => {
        const value = el.value.trim();
        return !value || /^\d*$/.test(value);
      },
      invalidClass: 'input-invalid',
    },
  ];

  /* ==========================================================================
     2. DOM ELEMENT REFERENCES
     ========================================================================== */

  // Element cache - populated during initialization
  const elements = {};

  /**
   * Initializes the elements cache by looking up all field registry IDs
   * and other required elements.
   */
  function initElements() {
    // Map field registry entries to elements
    FIELD_REGISTRY.forEach((field) => {
      const camelId = idToCamelCase(field.id);
      elements[camelId] = document.getElementById(field.id);
    });

    // Additional elements not in field registry
    elements.authorsContainer = document.getElementById('authors-container');
    elements.tocExtra = document.getElementById('toc-extra');
    elements.yamlOutput = document.getElementById('yaml-output');
    elements.copyButton = document.getElementById('copy-button');
    elements.copyStatus = document.getElementById('copy-status');
    elements.resetButton = document.getElementById('reset-button');
    elements.todayButton = document.getElementById('today-button');
  }

  /**
   * Converts a kebab-case ID to camelCase.
   * @param {string} id - The kebab-case ID (e.g., 'title-input')
   * @returns {string} The camelCase version (e.g., 'titleInput')
   */
  function idToCamelCase(id) {
    return id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /* ==========================================================================
     3. UTILITY FUNCTIONS
     ========================================================================== */

  /**
   * Returns a sorted shallow copy of an array of strings.
   * @param {Array} arr - The array to sort
   * @returns {Array} A sorted copy of the array
   */
  function sortedCopy(arr) {
    if (!Array.isArray(arr)) return arr;
    return arr.slice().map((v) => String(v)).sort();
  }

  /**
   * Escapes single quotes for YAML single-quoted strings.
   * @param {string} str - The string to escape
   * @returns {string} The escaped string
   */
  function escapeYamlSingleQuoted(str) {
    return str.replace(/'/g, "''");
  }

  /**
   * Formats a value as a YAML single-quoted string.
   * @param {string} value - The value to format
   * @returns {string} The formatted YAML string
   */
  function yamlQuote(value) {
    return "'" + escapeYamlSingleQuoted(value) + "'";
  }

  /**
   * Gets the trimmed value from an input element.
   * @param {HTMLElement} el - The input element
   * @returns {string} The trimmed value
   */
  function getTrimmedValue(el) {
    return (el.value || '').trim();
  }

  /**
   * Formats the current date as "Month Day, Year" (e.g., "December 31, 2025").
   * @returns {string} The formatted date string
   */
  function formatTodayDate() {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return today.toLocaleDateString('en-US', options);
  }

  /**
   * Sets the date input to today's date and updates the UI.
   */
  function setDateToToday() {
    elements.dateInput.value = formatTodayDate();
    updateAll();
  }

  /**
   * Shows or hides an element by setting display style.
   * @param {HTMLElement} el - The element to show/hide
   * @param {boolean} visible - Whether to show the element
   */
  function setVisibility(el, visible) {
    if (el && el.style) {
      el.style.display = visible ? '' : 'none';
    }
  }

  /**
   * Shows or hides a checkbox's parent label element.
   * @param {HTMLElement} checkbox - The checkbox element
   * @param {boolean} visible - Whether to show the label
   */
  function setCheckboxLabelVisibility(checkbox, visible) {
    const label = checkbox.closest('.checkbox-label') || checkbox.parentElement;
    setVisibility(label, visible);
  }

  /* ==========================================================================
     4. YAML BUILDING FUNCTIONS
     ========================================================================== */

  /**
   * Builds the metadata section (title, subtitle, date, authors).
   * @param {Array} lines - The lines array to append to
   */
  function buildMetadataSection(lines) {
    const title = getTrimmedValue(elements.titleInput);
    if (title.length > 0) {
      lines.push('title: ' + yamlQuote(title));
    }

    const subtitle = getTrimmedValue(elements.subtitleInput);
    if (subtitle.length > 0) {
      lines.push('subtitle: ' + yamlQuote(subtitle));
    }

    const date = getTrimmedValue(elements.dateInput);
    if (date.length > 0) {
      lines.push('date: ' + yamlQuote(date));
    }

    const authors = getAuthorValues();
    if (authors.length === 1) {
      lines.push('author: ' + yamlQuote(authors[0]));
    } else if (authors.length > 0) {
      lines.push('author:');
      // Emit authors in the order specified by the user (not sorted)
      authors.forEach((author) => {
        lines.push('- ' + yamlQuote(author));
      });
    }
  }

  /**
   * Builds the document class section (documentclass, classoptions).
   * @param {Array} lines - The lines array to append to
   * @returns {string} The current documentclass value
   */
  function buildDocumentSection(lines) {
    const documentclass = elements.documentclassSelect.value || DEFAULTS.documentclass;
    lines.push('documentclass: ' + documentclass);

    const classoptions = getSelectedClassoptions(documentclass);
    if (classoptions.length > 0) {
      lines.push('classoption:');
      sortedCopy(classoptions).forEach((opt) => {
        lines.push('- ' + opt);
      });
    }

    return documentclass;
  }

  /**
   * Builds the table of contents section.
   * @param {Array} lines - The lines array to append to
   */
  function buildTocSection(lines) {
    if (!elements.tocCheckbox.checked) return;

    lines.push('toc: true');

    const tocTitle = getTrimmedValue(elements.tocTitleInput);
    if (tocTitle.length > 0) {
      lines.push('toc-title: ' + yamlQuote(tocTitle));
    }

    const tocDepth = getTrimmedValue(elements.tocDepthInput);
    if (tocDepth && /^\d+$/.test(tocDepth)) {
      lines.push('toc-depth: ' + tocDepth);
    }
  }

  /**
   * Builds the page settings section (papersize, fontsize, geometry).
   * @param {Array} lines - The lines array to append to
   * @param {string} documentclass - The current documentclass
   */
  function buildPageSection(lines, documentclass) {
    const papersize = elements.papersizeSelect.value || DEFAULTS.papersize;
    lines.push('papersize: ' + papersize);

    const fontsize = elements.fontsizeSelect.value || DEFAULTS.fontsize;
    lines.push('fontsize: ' + fontsize);

    const margin = getTrimmedValue(elements.marginInput);
    const geometryLines = [];

    if (margin.length > 0) {
      geometryLines.push('margin=' + margin);
    }

    geometryLines.push(documentclass === 'book' ? 'includeheadfoot' : 'includefoot');

    if (geometryLines.length > 0) {
      lines.push('geometry:');
      sortedCopy(geometryLines).forEach((g) => {
        lines.push('- ' + g);
      });
    }
  }

  /**
   * Builds the links-as-notes option.
   * @param {Array} lines - The lines array to append to
   */
  function buildLinksSection(lines) {
    if (elements.linksAsNotesCheckbox.checked) {
      lines.push('links-as-notes: true');
    }
  }

  /**
   * Builds the header-includes section.
   * @param {Array} lines - The lines array to append to
   */
  function buildHeaderIncludes(lines) {
    const headerIncludes = [];

    HEADER_INCLUDES_REGISTRY.forEach((entry) => {
      const checkbox = document.getElementById(entry.id);
      if (!checkbox.checked) return;

      // Check conditional entries
      if (entry.type === 'conditional' && !entry.condition()) return;

      headerIncludes.push(entry.yaml);
    });

    if (headerIncludes.length > 0) {
      lines.push('header-includes:');
      sortedCopy(headerIncludes).forEach((h) => {
        lines.push(h);
      });
    }
  }

  /**
   * Builds the font section (mainfont, sansfont, monofont with fallbacks).
   * @param {Array} lines - The lines array to append to
   */
  function buildFontSection(lines) {
    const fontTypes = [
      { type: 'main', element: elements.mainfontSelect },
      { type: 'sans', element: elements.sansfontSelect },
      { type: 'mono', element: elements.monofontSelect },
    ];

    fontTypes.forEach(({ type, element }) => {
      const fontName = getTrimmedValue(element);
      if (fontName.length > 0) {
        addFont(type, fontName, lines);
      }
    });
  }

  /**
   * Adds a font entry with optional fallbacks to the YAML lines.
   * @param {string} fontType - The font type ('main', 'sans', or 'mono')
   * @param {string} fontName - The font name
   * @param {Array} lines - The lines array to append to
   */
  function addFont(fontType, fontName, lines) {
    lines.push(fontType + 'font: ' + yamlQuote(fontName));

    const addFallbacks = elements.optFallbacks.checked;
    const addFallbacksCJK = elements.optFallbacksCjk.checked;

    if (addFallbacks || addFallbacksCJK) {
      lines.push(fontType + 'fontfallback:');

      if (addFallbacks) {
        FONT_FALLBACKS.standard.forEach((fallback) => {
          lines.push('- "' + fallback + '"');
        });
      }

      if (addFallbacksCJK) {
        const isSerif = FONT_CONFIG.serif.includes(fontName);
        const cjkFallback = isSerif ? FONT_FALLBACKS.cjkSerif : FONT_FALLBACKS.cjkSans;
        lines.push('- "' + cjkFallback + '"');
      }
    }

    // Add font options for mono font
    if (fontName === MONO_FONT) {
      lines.push(fontType + 'fontoptions:');
      lines.push("- '`AutoFakeSlant,BoldItalicFeatures={FakeSlant}`{=latex}'");
    }
  }

  /**
   * Gets the selected class options based on current checkbox states.
   * @param {string} documentclass - The current documentclass
   * @returns {Array} Array of selected class options
   */
  function getSelectedClassoptions(documentclass) {
    const options = [];

    if (elements.optLandscape.checked) options.push('landscape');
    if (elements.optTwocolumn.checked) options.push('twocolumn');

    // Only include 'oneside' and 'openany' when documentclass is 'book'
    if (documentclass === 'book') {
      if (elements.optOneside.checked) options.push('oneside');
      if (elements.optOpenany.checked) options.push('openany');
    }

    return options.sort();
  }

  /**
   * Builds the complete YAML output.
   * @returns {string} The complete YAML string
   */
  function buildYaml() {
    const lines = ['---'];

    buildMetadataSection(lines);
    const documentclass = buildDocumentSection(lines);
    buildTocSection(lines);
    buildPageSection(lines, documentclass);
    buildLinksSection(lines);
    buildHeaderIncludes(lines);
    buildFontSection(lines);

    lines.push('---');

    // Ensure the YAML output always ends with exactly three newlines.
    return lines.join('\n') + '\n\n\n';
  }

  /* ==========================================================================
     5. UI MANAGEMENT FUNCTIONS
     ========================================================================== */

  /**
   * Updates visibility of conditional UI elements based on current state.
   */
  function updateVisibility() {
    VISIBILITY_RULES.forEach((rule) => {
      const target = document.getElementById(rule.targetId);
      const visible = rule.condition();

      if (rule.useLabel) {
        setCheckboxLabelVisibility(target, visible);
      } else {
        setVisibility(target, visible);
      }
    });
  }

  /**
   * Validates inputs and updates their visual state.
   */
  function updateValidation() {
    VALIDATION_RULES.forEach((rule) => {
      const target = document.getElementById(rule.targetId);
      const isValid = rule.validate(target);

      if (isValid) {
        target.classList.remove(rule.invalidClass);
      } else {
        target.classList.add(rule.invalidClass);
      }
    });
  }

  /**
   * Updates the entire UI: visibility, validation, and YAML output.
   */
  function updateAll() {
    updateVisibility();
    updateValidation();
    elements.yamlOutput.textContent = buildYaml();
  }

  /**
   * Resets all form fields to their default values.
   */
  function resetToDefaults() {
    FIELD_REGISTRY.forEach((field) => {
      const el = document.getElementById(field.id);
      const defaultValue = DEFAULTS[field.defaultKey];

      switch (field.type) {
        case 'text':
          el.value = defaultValue;
          break;
        case 'select':
          el.value = defaultValue;
          break;
        case 'checkbox':
          if (field.classoptionValue) {
            // Classoption checkboxes check against the classoptions array
            el.checked = Array.isArray(defaultValue) && defaultValue.includes(field.classoptionValue);
          } else {
            el.checked = defaultValue;
          }
          break;
      }
    });

    // Reset authors: clear container and add a single empty input
    elements.authorsContainer.innerHTML = '';
    addAuthorInput('');

    updateAll();
  }

  /**
   * Attaches event listeners to all form elements.
   */
  function attachListeners() {
    // Attach listeners to all registered fields
    FIELD_REGISTRY.forEach((field) => {
      const el = document.getElementById(field.id);
      el.addEventListener('input', updateAll);
      el.addEventListener('change', updateAll);
    });

    // Attach button listeners
    elements.resetButton.addEventListener('click', resetToDefaults);
    elements.copyButton.addEventListener('click', copyToClipboard);
    elements.todayButton.addEventListener('click', setDateToToday);
  }

  /* ==========================================================================
     6. AUTHORS HANDLING
     ========================================================================== */

  let authorInputCounter = 0;

  /**
   * Creates and adds an author input field.
   * @param {string} initialValue - The initial value for the input
   * @returns {HTMLInputElement} The created input element
   */
  function addAuthorInput(initialValue) {
    const idx = authorInputCounter++;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'field-multi-input';
    input.id = 'field-multi-input-' + idx;
    input.placeholder = 'e.g. First Last';
    input.value = initialValue || '';

    input.addEventListener('input', handleAuthorInput);
    input.addEventListener('blur', handleAuthorBlur);

    elements.authorsContainer.appendChild(input);
    return input;
  }

  /**
   * Handles input event on author fields.
   * @param {Event} event - The input event
   */
  function handleAuthorInput(event) {
    updateAll();

    const input = event.target;
    const allInputs = getAuthorInputs();

    // If this is the last input and it's non-empty, append a new empty input
    if (allInputs.length > 0 &&
        allInputs[allInputs.length - 1] === input &&
        input.value.trim().length > 0) {
      addAuthorInput('');
    }
  }

  /**
   * Handles blur event on author fields.
   * @param {Event} event - The blur event
   */
  function handleAuthorBlur(event) {
    const input = event.target;
    const allInputs = getAuthorInputs();

    // If input is empty on blur and this is not the last input, remove it
    if (allInputs.length > 0 &&
        allInputs[allInputs.length - 1] !== input &&
        input.value.trim().length === 0) {
      elements.authorsContainer.removeChild(input);
      updateAll();
    }
  }

  /**
   * Gets all author input elements.
   * @returns {Array} Array of author input elements
   */
  function getAuthorInputs() {
    return Array.from(elements.authorsContainer.querySelectorAll('.field-multi-input'));
  }

  /**
   * Gets the trimmed values from all author inputs.
   * @returns {Array} Array of non-empty author values
   */
  function getAuthorValues() {
    return getAuthorInputs()
      .map((input) => input.value.trim())
      .filter((value) => value.length > 0);
  }

  /* ==========================================================================
     7. CLIPBOARD FUNCTIONS
     ========================================================================== */

  let copyStatusTimeoutId = null;

  /**
   * Copies the YAML output to the clipboard.
   */
  function copyToClipboard() {
    const text = elements.yamlOutput.textContent || '';

    // Modern clipboard API
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard
        .writeText(text)
        .then(() => showCopyStatus('Copied to clipboard.'))
        .catch(() => showCopyStatus('Could not copy. Select the text and copy manually.'));
      return;
    }

    // Fallback: use a hidden textarea
    copyToClipboardFallback(text);
  }

  /**
   * Fallback clipboard copy using a hidden textarea.
   * @param {string} text - The text to copy
   */
  function copyToClipboardFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.setAttribute('aria-hidden', 'true');

    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      showCopyStatus('Copied to clipboard (fallback).');
    } catch (e) {
      showCopyStatus('Select the text and copy manually.');
    }

    document.body.removeChild(textarea);
  }

  /**
   * Shows a temporary copy status message.
   * @param {string} message - The message to display
   */
  function showCopyStatus(message) {
    elements.copyStatus.textContent = message;

    if (copyStatusTimeoutId !== null) {
      clearTimeout(copyStatusTimeoutId);
    }

    copyStatusTimeoutId = setTimeout(() => {
      elements.copyStatus.textContent = '';
      copyStatusTimeoutId = null;
    }, 2500);
  }

  /* ==========================================================================
     8. INITIALIZATION
     ========================================================================== */

  /**
   * Initializes the font select dropdowns with available fonts.
   */
  function initFonts() {
    const fontSelects = [
      elements.mainfontSelect,
      elements.sansfontSelect,
      elements.monofontSelect,
    ];

    fontSelects.forEach((fontSelect) => {
      // Add unset option
      const unsetOption = document.createElement('option');
      unsetOption.value = '';
      unsetOption.textContent = '(unset)';
      fontSelect.appendChild(unsetOption);

      // Add font options
      SORTED_FONTS.forEach((fontName) => {
        const option = document.createElement('option');
        option.value = fontName;
        option.textContent = fontName;
        fontSelect.appendChild(option);
      });
    });
  }

  /**
   * Main initialization function.
   */
  function init() {
    initElements();
    initFonts();
    attachListeners();
    resetToDefaults();
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
