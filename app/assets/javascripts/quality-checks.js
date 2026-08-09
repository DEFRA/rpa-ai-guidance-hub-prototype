//
// Quality checks, from "AI-enabled Guidance Tool: authoring and formatting
// requirements v2.0".
//
// One file, loaded by the browser and required by app/routes.js on the server,
// so the rules are written once. The issue list on a rendered page and the list
// the editor updates as you type cannot drift apart.
//
// Real checks would use a model — most of these rules need judgement, not a
// regular expression. These are close enough to put a realistic set of findings
// in front of a research participant, and each one carries the rule ID from the
// requirements so a finding can be traced back to what it came from.
//
// Severity follows the MUST / SHOULD / MAY wording in the requirements:
// a MUST or MUST NOT that breaks the structure is critical, other MUSTs are
// high, SHOULDs are medium, and anything advisory is low.
//
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else {
    root.appQualityChecks = factory()
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info']

  const SEVERITY_TAGS = {
    critical: { text: 'Critical', classes: 'govuk-tag--red' },
    high: { text: 'High', classes: 'govuk-tag--orange' },
    medium: { text: 'Medium', classes: 'govuk-tag--yellow' },
    low: { text: 'Low', classes: 'govuk-tag--blue' },
    info: { text: 'Info', classes: 'govuk-tag--grey' }
  }

  // GS-002: steps must start with an action verb.
  const ACTION_VERBS = [
    'open', 'select', 'enter', 'check', 'record', 'send', 'complete', 'review',
    'confirm', 'add', 'remove', 'update', 'upload', 'download', 'print', 'sign',
    'submit', 'tell', 'ask', 'call', 'email', 'go', 'choose', 'find', 'read',
    'set', 'save', 'close', 'return', 'contact', 'use', 'compare', 'copy',
    'attach', 'reject', 'approve', 'escalate', 'log', 'note', 'search'
  ]

  // Section 11: wording the tool must flag when no measurable rule is given.
  const AMBIGUOUS_WORDS = [
    'where possible', 'wherever possible', 'as appropriate', 'appropriate',
    'as necessary', 'if necessary', 'relevant', 'as required', 'suitable',
    'in a timely manner', 'reasonable'
  ]

  const MAX_SENTENCE_WORDS = 25

  function words (text) {
    return text.trim().split(/\s+/).filter(Boolean)
  }

  function sentences (text) {
    return text.split(/(?<=[.!?])\s+/).filter(function (s) { return s.trim() })
  }

  function isNumberedStep (line) {
    return /^\s*\d+\.\s+/.test(line)
  }

  function isBullet (line) {
    return /^\s*[-*]\s+/.test(line)
  }

  function stripMarkdown (line) {
    return line
      .replace(/^\s*#{1,6}\s+/, '')
      .replace(/^\s*\d+\.\s+/, '')
      .replace(/^\s*[-*]\s+/, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\*\*|\*/g, '')
      .trim()
  }

  // ---------------------------------------------------------------------
  // Rules
  // ---------------------------------------------------------------------

  const RULES = [
    {
      id: 'GP-001',
      name: 'Purpose statement',
      severity: 'critical',
      scope: 'document',
      requirement:
        'Every guide MUST begin with a purpose statement covering the user role, the task, the outcome and the system access needed.',
      whyItMatters:
        'Without it a reader cannot tell whether the guidance is for them, or whether they have what they need before starting.',
      recommendation:
        'Add the missing lines to the purpose statement, using the format "As a… You need to… So that… You need access to…".',
      detect: function (markdown) {
        const fields = [
          { label: 'As a', pattern: /^\s*As a\b/im },
          { label: 'You need to', pattern: /^\s*You need to\b/im },
          { label: 'So that', pattern: /^\s*So that\b/im },
          { label: 'You need access to', pattern: /^\s*You need access to\b/im }
        ]

        return fields
          .filter(function (field) { return !field.pattern.test(markdown) })
          .map(function (field) {
            // No line: this is about the guide as a whole.
            return { title: 'The purpose statement has no "' + field.label + '" line' }
          })
      }
    },
    {
      id: 'GST-003',
      name: 'Before you start',
      severity: 'medium',
      scope: 'document',
      requirement:
        'Guidance SHOULD include a "Before you start" section listing prerequisites, or record that none are required.',
      whyItMatters:
        'A reader who gets halfway through and finds they lack a permission or document has to abandon the task and start again.',
      recommendation:
        'Add a "Before you start" section, or state that nothing is needed before beginning.',
      detect: function (markdown) {
        if (/^#{1,6}\s*Before you start/im.test(markdown)) return []
        return [{ title: 'The guide has no "Before you start" section' }]
      }
    },
    {
      id: 'GD-001',
      name: 'Decision point structure',
      severity: 'high',
      scope: 'line',
      requirement:
        'Every decision point MUST use IF, THEN and NEXT STEP so the condition, outcome and next action are all stated.',
      whyItMatters:
        'A decision without a stated next action leaves the reader guessing where to go, which is where mistakes happen under pressure.',
      recommendation:
        'Rewrite as "IF <condition> THEN <action>. NEXT STEP: <what to do next>".',
      detect: function (line) {
        const text = stripMarkdown(line)
        // A conditional sentence that does not use the required structure.
        if (!/\bif\b/i.test(text)) return []
        if (/\bIF\b[\s\S]*\bTHEN\b/.test(text) && /NEXT STEP/i.test(text)) return []
        if (!/^(if|.*\bif the\b|.*\bif you\b|.*\bif it\b)/i.test(text)) return []
        return [{ title: 'Decision point does not use IF, THEN and NEXT STEP', quote: text }]
      }
    },
    {
      id: 'GS-002',
      name: 'Step starts with an action verb',
      severity: 'high',
      scope: 'line',
      requirement: 'Each step MUST start with an action verb.',
      whyItMatters:
        'A step that does not open with the action makes the reader work out what they are being asked to do.',
      recommendation:
        'Start the step with the action, for example "Open the case" or "Check the customer details".',
      detect: function (line) {
        if (!isNumberedStep(line)) return []
        const text = stripMarkdown(line)
        const first = (words(text)[0] || '').toLowerCase().replace(/[^a-z]/g, '')
        if (ACTION_VERBS.indexOf(first) !== -1) return []
        return [{ title: 'Step does not start with an action verb', quote: text }]
      }
    },
    {
      id: 'GS-005',
      name: 'One action per step',
      severity: 'high',
      scope: 'line',
      requirement:
        'A step MUST NOT contain multiple instructions joined by and, then or before unless the actions cannot be separated.',
      whyItMatters:
        'Compound steps are the commonest cause of a reader completing half an instruction and believing they are done.',
      recommendation: 'Split this into separate numbered steps, one action each.',
      detect: function (line) {
        if (!isNumberedStep(line)) return []
        const text = stripMarkdown(line)
        const match = text.match(/\b(and then|and|then|before)\b\s+[a-z]+/i)
        if (!match) return []
        // "and" inside a noun phrase is fine; only flag where a verb follows.
        const following = match[0].split(/\s+/).pop().toLowerCase()
        if (ACTION_VERBS.indexOf(following) === -1) return []
        return [{ title: 'Step contains more than one action', quote: text }]
      }
    },
    {
      id: 'GW-004',
      name: 'Sentence length',
      severity: 'medium',
      scope: 'line',
      requirement:
        'Sentences SHOULD be 25 words or fewer where this does not change the meaning.',
      whyItMatters:
        'Long sentences are harder to follow, and operational readers are usually scanning rather than reading.',
      recommendation: 'Split the sentence, or cut the words that carry no meaning.',
      detect: function (line) {
        const text = stripMarkdown(line)
        if (!text || /^#{1,6}/.test(line)) return []

        return sentences(text)
          .filter(function (sentence) { return words(sentence).length > MAX_SENTENCE_WORDS })
          .map(function (sentence) {
            return {
              title: 'Sentence is ' + words(sentence).length + ' words',
              quote: sentence.trim()
            }
          })
      }
    },
    {
      id: 'GW-003',
      name: 'Acronym not explained',
      severity: 'high',
      scope: 'document',
      requirement: 'Acronyms MUST be explained the first time they appear.',
      whyItMatters:
        'A reader new to the team cannot look up an acronym they have never seen spelled out.',
      recommendation:
        'Write the term in full the first time, with the acronym in brackets after it.',
      detect: function (markdown, lines) {
        const seen = {}
        const found = []

        lines.forEach(function (line, index) {
          const text = stripMarkdown(line)
          const matches = text.match(/\b[A-Z]{2,6}\b/g) || []

          matches.forEach(function (acronym) {
            if (seen[acronym]) return
            seen[acronym] = true
            // Explained if the acronym appears in brackets after words.
            if (new RegExp('\\w+\\s*\\(' + acronym + '\\)').test(markdown)) return
            // IF / THEN are structural, not acronyms.
            if (['IF', 'THEN', 'NEXT', 'STEP'].indexOf(acronym) !== -1) return
            found.push({
              title: '"' + acronym + '" is not explained on first use',
              quote: text,
              line: index + 1
            })
          })
        })

        return found
      }
    },
    {
      id: 'GW-001',
      name: 'Passive voice',
      severity: 'medium',
      scope: 'line',
      requirement: 'Use active voice wherever possible.',
      whyItMatters:
        'Passive sentences hide who does the action, so the reader cannot tell whether it is their job.',
      recommendation: 'Rewrite so the sentence says who does what.',
      detect: function (line) {
        const text = stripMarkdown(line)
        const match = text.match(/\b(is|are|was|were|be|been|being)\s+(\w+ed|sent|made|given|taken|written|held|kept|shown)\b/i)
        if (!match) return []
        return [{ title: 'Passive voice: "' + match[0] + '"', quote: text }]
      }
    },
    {
      id: 'GDV-001',
      name: 'Ambiguous wording',
      severity: 'medium',
      scope: 'line',
      requirement:
        'The tool MUST flag ambiguous wording where no measurable rule is given.',
      whyItMatters:
        'Words like "appropriate" leave the reader to invent a rule, and two people will invent different ones.',
      recommendation:
        'Replace with the specific rule, for example a named document, a number or a time limit.',
      detect: function (line) {
        const text = stripMarkdown(line)
        const found = []

        AMBIGUOUS_WORDS.forEach(function (word) {
          const expression = new RegExp('\\b' + word + '\\b', 'i')
          if (expression.test(text)) {
            found.push({ title: 'Ambiguous wording: "' + word + '"', quote: text })
          }
        })

        // Only report the longest match on a line, so "as appropriate" does not
        // also report "appropriate".
        return found.slice(0, 1)
      }
    },
    {
      id: 'GI-002',
      name: 'Image alt text',
      severity: 'high',
      scope: 'line',
      requirement: 'Each image MUST have alt text describing its purpose.',
      whyItMatters:
        'Without alt text the image is invisible to anyone using a screen reader, and the guidance fails accessibility regulations.',
      recommendation:
        'Describe what the image shows and why it is there, not just what it is a picture of.',
      detect: function (line) {
        const found = []
        const images = /!\[([^\]]*)\]\(([^)]*)\)/g
        let match

        while ((match = images.exec(line)) !== null) {
          if (!match[1].trim()) {
            found.push({ title: 'Image has no alt text', quote: match[2] })
          }
        }

        return found
      }
    },
    {
      id: 'GS-004',
      name: 'Bullets used for ordered steps',
      severity: 'medium',
      scope: 'document',
      requirement:
        'Bullets MUST be used only when the order does not matter; ordered steps MUST be numbered.',
      whyItMatters:
        'A bulleted list of actions gives no indication that they have to happen in sequence.',
      recommendation: 'Number these items if they must be done in order.',
      detect: function (markdown, lines) {
        const found = []

        lines.forEach(function (line, index) {
          if (!isBullet(line)) return
          const text = stripMarkdown(line)
          const first = (words(text)[0] || '').toLowerCase().replace(/[^a-z]/g, '')
          if (ACTION_VERBS.indexOf(first) === -1) return
          found.push({
            title: 'Bulleted item is an action, so the order may matter',
            quote: text,
            line: index + 1
          })
        })

        return found
      }
    }
  ]

  // ---------------------------------------------------------------------
  // Running the checks
  // ---------------------------------------------------------------------

  function severityTag (severity) {
    return SEVERITY_TAGS[severity] || SEVERITY_TAGS.info
  }

  // The nearest heading above a line, used as the finding's location so a
  // reader can tell where in the document it sits without a line number.
  function sectionsFor (lines) {
    let current = 'Introduction'
    return lines.map(function (line) {
      const heading = line.trim().match(/^#{1,6}\s+(.*)$/)
      if (heading) current = heading[1]
      return current
    })
  }

  function findIssues (markdown) {
    const lines = markdown.split('\n')
    const sections = sectionsFor(lines)
    const issues = []

    RULES.forEach(function (rule) {
      if (rule.scope === 'document') {
        (rule.detect(markdown, lines) || []).forEach(function (hit) {
          // Some document-level rules point at a line (an unexplained acronym);
          // others are about the guide as a whole (a missing section).
          issues.push(buildIssue(rule, hit, hit.line || 1, sections, !hit.line))
        })
        return
      }

      lines.forEach(function (line, index) {
        (rule.detect(line, index) || []).forEach(function (hit) {
          issues.push(buildIssue(rule, hit, index + 1, sections))
        })
      })
    })

    return issues
      .sort(function (a, b) {
        const bySeverity = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
        return bySeverity !== 0 ? bySeverity : a.line - b.line
      })
      .map(function (issue, index) {
        // A stable position in the sorted list, used as the finding's id in
        // URLs so "finding 3" means the same thing on every page.
        issue.id = index
        issue.number = index + 1
        return issue
      })
  }

  function buildIssue (rule, hit, line, sections, wholeDocument) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      severityTag: severityTag(rule.severity),
      title: hit.title,
      quote: hit.quote || '',
      requirement: rule.requirement,
      whyItMatters: rule.whyItMatters,
      recommendation: rule.recommendation,
      line: line,
      section: wholeDocument ? 'Whole document' : (sections[line - 1] || 'Introduction')
    }
  }

  // Counts per severity, worst first, omitting empty ones.
  function severityCounts (issues) {
    return SEVERITY_ORDER
      .map(function (severity) {
        return {
          severity: severity,
          tag: severityTag(severity),
          count: issues.filter(function (issue) { return issue.severity === severity }).length
        }
      })
      .filter(function (entry) { return entry.count > 0 })
  }

  // The requirements separate what must be fixed from what is advisory, and the
  // POC front end splits its task list the same way.
  function split (issues) {
    return {
      important: issues.filter(function (issue) {
        return issue.severity === 'critical' || issue.severity === 'high'
      }),
      suggestions: issues.filter(function (issue) {
        return issue.severity !== 'critical' && issue.severity !== 'high'
      })
    }
  }

  return {
    RULES: RULES,
    SEVERITY_ORDER: SEVERITY_ORDER,
    findIssues: findIssues,
    severityTag: severityTag,
    severityCounts: severityCounts,
    split: split
  }
})
