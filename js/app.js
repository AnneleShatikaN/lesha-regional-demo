/* ==========================================================================
   Lesha Teacher Portal — Ministry Demo Prototype
   Shared navigation, data loading, and page rendering
   ========================================================================== */

const NAV_ITEMS = [
  { role: 'teacher',   label: 'Teacher',   href: 'teacher.html' },
  { role: 'hod',       label: 'HOD',       href: 'hod.html' },
  { role: 'inspector', label: 'Inspector', href: 'inspector.html' },
  { role: 'seo',       label: 'SEO',       href: 'seo.html' },
];

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* -------------------------------------------------------------------------
   Data loading
   ------------------------------------------------------------------------- */

async function loadData() {
  const res = await fetch('data/demo.json');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

function renderLoadError(container) {
  container.innerHTML = `
    <div class="card" style="padding:32px; max-width:640px; margin:60px auto; text-align:center;">
      <h2 style="margin-bottom:12px;">Couldn't load demo.json</h2>
      <p class="muted">This page reads its numbers from <code>data/demo.json</code>. If you opened this
      file by double-clicking it, some browsers (Chrome in particular) block local file requests.</p>
      <p class="muted">Try running a small local server from the prototype folder, e.g.
      <code>python3 -m http.server</code>, then open <code>http://localhost:8000</code> — or open the
      files in Firefox, which allows local <code>fetch()</code> by default.</p>
    </div>`;
}

/* -------------------------------------------------------------------------
   Scope grid — signature motif encoding what each role can see
   ------------------------------------------------------------------------- */

function cluster(cols) {
  return `<div class="scope-grid is-filled" style="--cols:${cols}">${'<span></span>'.repeat(cols * cols)}</div>`;
}

function scopeGridHTML(role) {
  switch (role) {
    case 'teacher':
      return `<div class="scope-cluster-row">${cluster(3)}</div>`;
    case 'hod':
      return `<div class="scope-cluster-row">${cluster(6)}</div>`;
    case 'inspector':
      return `<div class="scope-cluster-row">${cluster(6)}${cluster(6)}</div>`;
    case 'seo':
      return `<div style="display:flex; flex-direction:column; gap:4px;">
                <div class="scope-cluster-row">${cluster(6)}${cluster(6)}</div>
                <div class="scope-cluster-row">${cluster(6)}${cluster(6)}</div>
              </div>`;
    default:
      return '';
  }
}

/* -------------------------------------------------------------------------
   Header / breadcrumb
   ------------------------------------------------------------------------- */

function renderHeader(active, breadcrumb) {
  const headerEl = document.getElementById('site-header');
  if (headerEl) {
    const nav = NAV_ITEMS.map(item =>
      `<a href="${item.href}" class="${item.role === active ? 'is-active' : ''}">${item.label}</a>`
    ).join('');
    headerEl.innerHTML = `
      <div class="site-header__inner">
        <a href="index.html" class="brand">
          <span class="brand__mark">Lesha</span>
          <span class="brand__tag">Ministry Demo</span>
        </a>
        <nav class="role-switcher" aria-label="Switch role view">${nav}</nav>
      </div>`;
  }
  const crumbEl = document.getElementById('breadcrumb-bar');
  if (crumbEl && breadcrumb) {
    crumbEl.innerHTML = `
      <div class="breadcrumb-bar__inner">
        ${scopeGridHTML(active)}
        <span>${breadcrumb}</span>
      </div>`;
  }
}

/* -------------------------------------------------------------------------
   Small animation helpers
   ------------------------------------------------------------------------- */

function animateValue(el, end, { decimals = 0, suffix = '', duration = 900 } = {}) {
  if (REDUCED_MOTION) { el.textContent = end.toFixed(decimals) + suffix; return; }
  const start = 0;
  const t0 = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = start + (end - start) * eased;
    el.textContent = val.toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function revealLedgerItems(root) {
  const items = root.querySelectorAll('.stat-ledger__item');
  items.forEach((item, i) => {
    setTimeout(() => item.classList.add('is-visible'), REDUCED_MOTION ? 0 : i * 90);
  });
}

function fillBars(root) {
  requestAnimationFrame(() => {
    root.querySelectorAll('.pct-bar__fill[data-target]').forEach(bar => {
      bar.style.width = bar.dataset.target + '%';
    });
  });
}

/* -------------------------------------------------------------------------
   Shared markup builders
   ------------------------------------------------------------------------- */

function tickStrip(covered, total) {
  let html = '';
  for (let i = 0; i < total; i++) {
    html += `<span class="${i < covered ? 'is-covered' : ''}"></span>`;
  }
  return `<div class="tick-strip">${html}</div>`;
}

function pctBar(pct) {
  return `<div class="pct-bar"><div class="pct-bar__fill" data-target="${pct}"></div></div>`;
}

function statusBadge(status) {
  const map = {
    'approved': ['badge--approved', 'Approved'],
    'pending': ['badge--pending', 'Pending'],
    'needs revision': ['badge--revision', 'Needs revision'],
  };
  const [cls, label] = map[status] || ['badge--pending', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function weakList(items, keyLabel = 'mentions') {
  return `<ul class="weak-list">${items.map(w =>
    `<li><span>${w.topic}</span><span class="count">${w.mentions ?? w.count}</span></li>`
  ).join('')}</ul>`;
}

function tagRow(items) {
  return `<div class="tag-row">${items.map(w => `<span class="tag">${w.topic}</span>`).join('')}</div>`;
}

/* ==========================================================================
   REUSABLE: Class → Learner drill-down (two-level accordion)
   Used by Teacher view and HOD subject-grade drilldown
   ========================================================================== */

function renderClassLearnerDrilldown(classData, container) {
  container.innerHTML = `
    <div class="learner-list">
      ${classData.learners_sample.map((l, li) => `
        <div class="learner-row" data-learner-index="${li}">
          <div class="learner-row__summary">
            <span class="learner-row__name">${l.name}</span>
            <span class="learner-row__progress">Progress: ${l.progress_percentage}%</span>
            <span class="learner-row__score">Score: ${l.average_score_percentage ?? '—'}%</span>
            <span class="learner-row__weak-count">${l.weak_areas.length} weak area${l.weak_areas.length !== 1 ? 's' : ''}</span>
            <span class="chevron">&#8250;</span>
          </div>
          <div class="learner-detail">
            <div class="learner-card__weak">
              ${l.weak_areas.map(w => `<span class="mini-tag">${w.topic} &middot; ${w.count}</span>`).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Wire learner row click to toggle individual detail
  container.querySelectorAll('.learner-row__summary').forEach(row => {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = row.closest('.learner-row');
      parent.classList.toggle('is-open');
      parent.querySelector('.learner-detail').classList.toggle('is-open');
    });
  });
}

/* ==========================================================================
   REUSABLE: Teacher view — renders to any container
   ========================================================================== */

function renderTeacherView(teacherData, container) {
  const tv = teacherData;
  const pendingCount = (tv.lesson_plan_history || []).filter(p => p.status === 'pending').length;

  container.innerHTML = `
    <div class="stat-ledger">
      <div class="stat-ledger__item">
        <span class="stat-ledger__value numeral" id="stat-ai-ts"></span>
        <span class="stat-ledger__label">Average AI lesson score</span>
      </div>
      <div class="stat-ledger__item">
        <span class="stat-ledger__value numeral" id="stat-cov-ts"></span>
        <span class="stat-ledger__label">Overall syllabus coverage</span>
      </div>
      <div class="stat-ledger__item">
        <span class="stat-ledger__value numeral">${pendingCount}</span>
        <span class="stat-ledger__label">Lesson plans pending</span>
      </div>
    </div>

    <div class="section">
      <div class="section__head">
        <h2>My classes</h2>
        <span class="section__hint">Click a class to see individual learners</span>
      </div>
      <div class="card-grid card-grid--2" id="classes-ts"></div>
    </div>

    <div class="section">
      <div class="section__head">
        <h2>Lesson plan history</h2>
      </div>
      <table class="data-table">
        <thead>
          <tr><th>Objective</th><th>Class</th><th>AI score</th><th>Status</th><th>Submitted</th></tr>
        </thead>
        <tbody id="lesson-plan-rows-ts"></tbody>
      </table>
    </div>
  `;

  // Animate stats
  const ledger = container.querySelector('.stat-ledger');
  revealLedgerItems(ledger);
  const aiEl = container.querySelector('#stat-ai-ts');
  const covEl = container.querySelector('#stat-cov-ts');
  if (aiEl) animateValue(aiEl, tv.average_ai_lesson_score, { decimals: 0 });
  if (covEl) animateValue(covEl, tv.overall_syllabus_coverage_percentage ?? tv.syllabus_coverage_overall_percentage ?? 0, { decimals: 1, suffix: '%' });

  // Class cards with two-level accordion
  const classesEl = container.querySelector('#classes-ts');
  if (classesEl) {
    classesEl.innerHTML = (tv.classes || []).map((c, i) => `
      <div class="class-card card" data-class-index="${i}">
        <div class="class-card__top">
          <div>
            <div class="class-card__grade">${c.grade} &middot; ${c.subject}</div>
            <div class="class-card__subject">${c.class_id}</div>
          </div>
          <div class="class-card__size">${c.class_size} learners</div>
        </div>
        ${tickStrip(c.syllabus_coverage.objectives_covered, c.syllabus_coverage.total_objectives)}
        <div class="coverage-caption">
          <span>Syllabus coverage</span>
          <strong>${c.syllabus_coverage.objectives_covered} / ${c.syllabus_coverage.total_objectives} objectives (${c.syllabus_coverage.percentage}%)</strong>
        </div>
        <div style="margin-top:14px;">
          <div class="section__hint" style="margin-bottom:8px;">Top weak areas in this class</div>
          ${tagRow(c.class_weak_area_summary_top3)}
        </div>
        <div class="class-card__expand-hint"><span class="chevron">&#8250;</span> View learner-level detail</div>
        <div class="class-detail" id="class-learners-${i}"></div>
      </div>
    `).join('');

    // Wire class card clicks — load learner drilldown on first expand
    classesEl.querySelectorAll('.class-card').forEach(card => {
      card.addEventListener('click', function(e) {
        // Don't toggle if clicking inside already-expanded learner detail
        if (e.target.closest('.learner-detail') || e.target.closest('.learner-row__summary')) return;
        card.classList.toggle('is-open');
        const detail = card.querySelector('.class-detail');
        detail.classList.toggle('is-open');
        if (detail.classList.contains('is-open') && !detail.dataset.filled) {
          detail.dataset.filled = '1';
          const i = parseInt(card.dataset.classIndex);
          renderClassLearnerDrilldown(tv.classes[i], detail);
        }
      });
    });
  }

  // Lesson plan history table
  const lpBody = container.querySelector('#lesson-plan-rows-ts');
  if (lpBody) {
    lpBody.innerHTML = (tv.lesson_plan_history || []).map(p => `
      <tr>
        <td><strong>${p.objective_title}</strong><div class="muted" style="font-size:0.78rem;">${p.related_topic}</div></td>
        <td>${p.grade} &middot; ${p.subject}</td>
        <td><span class="score-chip">${p.ai_score}</span></td>
        <td>${statusBadge(p.status)}</td>
        <td class="muted">${p.date_submitted}</td>
      </tr>
    `).join('');
  }
}

/* ==========================================================================
   TEACHER PAGE (page-level init — thin wrapper)
   ========================================================================== */

function initTeacher(data) {
  const tv = data.views.teacher_view;
  renderHeader('teacher', `${tv.school} &nbsp;<span class="sep">/</span>&nbsp; ${tv.circuit} &nbsp;<span class="sep">/</span>&nbsp; ${tv.region}`);

  document.getElementById('teacher-name').textContent = tv.teacher_name;
  document.getElementById('teacher-subjects').textContent = tv.subjects_taught.join(' & ');

  // Remove existing sections/stat-ledger (from static HTML) and render fresh
  const main = document.querySelector('main');
  const statLedger = document.getElementById('stat-ledger');
  if (statLedger) statLedger.remove();
  // Remove all section elements after page-head
  main.querySelectorAll('.section').forEach(s => s.remove());

  const wrapper = document.createElement('div');
  main.appendChild(wrapper);
  renderTeacherView(tv, wrapper);
}

/* ==========================================================================
   LESSON PLAN PAGE
   ========================================================================== */

function initLessonPlan(data) {
  const tv = data.views.teacher_view;
  renderHeader('teacher', `${tv.school} &nbsp;<span class="sep">/</span>&nbsp; New lesson plan`);

  const select = document.getElementById('objective-select');
  select.innerHTML = tv.lesson_plan_history.map((p, i) =>
    `<option value="${i}">${p.grade} ${p.subject} — ${p.objective_title}</option>`
  ).join('');

  const objectivesField = document.getElementById('field-objectives');
  function syncObjective() {
    const plan = tv.lesson_plan_history[select.value];
    objectivesField.value = plan.objective_title;
  }
  select.addEventListener('change', syncObjective);
  syncObjective();

  const evalBtn = document.getElementById('evaluate-btn');
  const scorePanel = document.getElementById('score-panel');
  const placeholder = document.getElementById('score-placeholder');
  const submitBtn = document.getElementById('submit-btn');

  evalBtn.addEventListener('click', () => {
    const plan = tv.lesson_plan_history[select.value];
    placeholder.style.display = 'none';
    scorePanel.style.display = 'block';

    animateValue(document.getElementById('score-total-value'), plan.ai_score, { decimals: 0 });

    const rows = [
      ['Objective alignment', plan.score_breakdown.objective_alignment_pct],
      ['Misconception coverage', plan.score_breakdown.misconception_coverage_pct],
      ['Examiner language', plan.score_breakdown.examiner_language_pct],
      ['Cognitive load', plan.score_breakdown.cognitive_load_pct],
    ];
    document.getElementById('score-bars').innerHTML = rows.map(([label, val], i) => `
      <div class="score-bar-row">
        <div class="score-bar-row__top"><span>${label}</span><span class="val">${val}%</span></div>
        <div class="pct-bar"><div class="pct-bar__fill" data-target="${val}" id="bar-${i}"></div></div>
      </div>
    `).join('');
    fillBars(document.getElementById('score-bars'));

    const best = rows.reduce((a, b) => (b[1] > a[1] ? b : a));
    const worst = rows.reduce((a, b) => (b[1] < a[1] ? b : a));
    document.getElementById('feedback-text').textContent =
      `Strongest on ${best[0].toLowerCase()} (${best[1]}%). The biggest opportunity is ${worst[0].toLowerCase()} (${worst[1]}%) — consider tightening this before submitting.`;

    submitBtn.disabled = false;
  });

  submitBtn.addEventListener('click', () => {
    showToast(`Submitted to ${data.views.hod_view.hod_name} for sign-off.`);
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitted';
  });
}

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  requestAnimationFrame(() => toast.classList.add('is-shown'));
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('is-shown'), 3200);
}

/* ==========================================================================
   HOD PAGE — reusable render + page-level init
   ========================================================================== */

function findLessonPlanBreakdown(data, id) {
  for (const circuit of data.region.circuits) {
    for (const school of circuit.schools) {
      if (!school.department) continue;
      for (const teacher of school.department.teachers) {
        const plan = teacher.lesson_plan_history.find(p => p.id === id);
        if (plan) return plan.score_breakdown;
      }
    }
  }
  return null;
}

function findTeacherFullData(data, teacherName) {
  // Search all circuits/schools/departments for full teacher data, including classes
  for (const circuit of data.region.circuits) {
    for (const school of circuit.schools) {
      const dept = school.department || school.department_summary;
      if (!dept) continue;
      const teachers = dept.teachers || [];
      for (const t of teachers) {
        if (t.name === teacherName) {
          // If teacher has classes_assigned but no classes, look up full class data
          if ((!t.classes || t.classes.length === 0) && t.classes_assigned && dept.classes) {
            t.classes = dept.classes
              .filter(c => t.classes_assigned.includes(c.class_id))
              .map(c => ({
                class_id: c.class_id,
                grade: c.grade,
                subject: c.subject,
                class_size: c.class_size,
                syllabus_coverage: {
                  objectives_covered: c.objectives_covered,
                  total_objectives: c.total_objectives,
                  percentage: c.syllabus_coverage_percentage
                },
                learners_sample: c.learners_sample || [],
                class_weak_area_summary_top3: c.class_weak_area_summary_top3 || []
              }));
          }
          // Also normalize syllabus_coverage if it exists in by_class format
          if (t.syllabus_coverage && t.syllabus_coverage.by_class && !t.overall_syllabus_coverage_percentage) {
            t.overall_syllabus_coverage_percentage = t.syllabus_coverage.overall_percentage || t.syllabus_coverage_overall_percentage || 0;
          }
          return t;
        }
      }
    }
  }
  return null;
}

function renderHodView(hodData, container, allData) {
  const hv = hodData;
  const subjects = Object.keys(hv.syllabus_coverage_per_subject).sort();
  const avgScore = hv.teachers.reduce((s, t) => s + (t.average_ai_lesson_score || 0), 0) / (hv.teachers.length || 1);
  const avgCoverage = subjects.reduce((s, sub) => s + hv.syllabus_coverage_per_subject[sub].average_percentage, 0) / (subjects.length || 1);
  const pendingCount = (hv.pending_lesson_plans_awaiting_signoff || []).length;

  container.innerHTML = `
    <div class="stat-ledger">
      <div class="stat-ledger__item">
        <span class="stat-ledger__value numeral">${hv.teachers.length}</span>
        <span class="stat-ledger__label">Teachers in department</span>
      </div>
      <div class="stat-ledger__item">
        <span class="stat-ledger__value numeral" id="stat-avg-hd"></span>
        <span class="stat-ledger__label">Department avg AI score</span>
      </div>
      <div class="stat-ledger__item">
        <span class="stat-ledger__value numeral" id="stat-cov-hd"></span>
        <span class="stat-ledger__label">Avg syllabus coverage</span>
      </div>
      <div class="stat-ledger__item">
        <span class="stat-ledger__value numeral">${pendingCount}</span>
        <span class="stat-ledger__label">Awaiting sign-off</span>
      </div>
    </div>

    <div class="section">
      <div class="section__head">
        <h2>Teachers in department</h2>
        <span class="section__hint">Click a teacher to see their full view</span>
      </div>
      <table class="data-table">
        <thead>
          <tr><th>Teacher</th><th>Subject(s)</th><th>Avg AI score</th><th>Syllabus coverage</th></tr>
        </thead>
        <tbody id="teacher-rows-hd"></tbody>
      </table>
      <div id="teacher-drilldown-hd" class="drilldown"></div>
    </div>

    <div class="section">
      <div class="section__head">
        <h2>Syllabus coverage &amp; weak areas by subject-grade</h2>
        <span class="section__hint">Click a card to drill into classes</span>
      </div>
      <div class="card-grid card-grid--4" id="subject-cards-hd"></div>
      <div id="subject-drilldown-hd" class="drilldown"></div>
    </div>

    <div class="section">
      <div class="section__head">
        <h2>Awaiting sign-off</h2>
        <span class="section__hint">Approve or send back for revision</span>
      </div>
      <div id="pending-plans-hd"></div>
    </div>
  `;

  // Animate
  const ledger = container.querySelector('.stat-ledger');
  revealLedgerItems(ledger);
  const aiEl = container.querySelector('#stat-avg-hd');
  const covEl = container.querySelector('#stat-cov-hd');
  if (aiEl) animateValue(aiEl, avgScore, { decimals: 1 });
  if (covEl) animateValue(covEl, avgCoverage, { decimals: 1, suffix: '%' });

  // Teachers table — clickable rows
  const teacherRowsEl = container.querySelector('#teacher-rows-hd');
  teacherRowsEl.innerHTML = hv.teachers.map((t, ti) => `
    <tr class="teacher-row-clickable" data-teacher-index="${ti}" style="cursor:pointer;">
      <td><strong>${t.name}</strong></td>
      <td>${(t.subjects_taught || []).join(' & ')}</td>
      <td><span class="score-chip">${t.average_ai_lesson_score ?? '—'}</span></td>
      <td style="min-width:160px;">
        ${pctBar(t.syllabus_coverage_overall_percentage ?? 50)}
        <span class="muted" style="font-size:0.78rem;">${t.syllabus_coverage_overall_percentage ?? 50}%</span>
      </td>
    </tr>
  `).join('');
  fillBars(teacherRowsEl);

  // Wire teacher row clicks to show teacher view
  teacherRowsEl.querySelectorAll('.teacher-row-clickable').forEach(row => {
    row.addEventListener('click', () => {
      const ti = parseInt(row.dataset.teacherIndex);
      const teacher = hv.teachers[ti];
      const drilldown = container.querySelector('#teacher-drilldown-hd');
      
      if (drilldown.dataset.activeTeacher === String(ti)) {
        drilldown.classList.remove('is-open');
        drilldown.dataset.activeTeacher = '';
        return;
      }

      // Get enriched teacher data
      let teacherData = teacher;
      if (allData) {
        const full = findTeacherFullData(allData, teacher.name);
        if (full) teacherData = full;
      }

      // Build a teacher_view-compatible object
      const tvCompatible = {
        teacher_name: teacherData.name,
        school: hv.school || '',
        circuit: '',
        region: '',
        subjects_taught: teacherData.subjects_taught || [],
        classes: teacherData.classes || [],
        lesson_plan_history: teacherData.lesson_plan_history || [],
        average_ai_lesson_score: teacherData.average_ai_lesson_score || 0,
        overall_syllabus_coverage_percentage: teacherData.syllabus_coverage_overall_percentage || 0,
        syllabus_coverage_overall_percentage: teacherData.syllabus_coverage_overall_percentage || 0
      };

      drilldown.classList.add('is-open');
      drilldown.dataset.activeTeacher = String(ti);
      renderTeacherView(tvCompatible, drilldown);
    });
  });

  // Subject-grade cards — now split by grade in data, clickable to drill into classes
  const subjectCardsEl = container.querySelector('#subject-cards-hd');
  subjectCardsEl.innerHTML = subjects.map(sub => {
    const cov = hv.syllabus_coverage_per_subject[sub];
    return `
      <div class="card subject-grade-card" data-subject="${sub.replace(/"/g, '&quot;')}" style="padding:22px; cursor:pointer;">
        <h3 style="font-size:1.05rem; margin-bottom:4px;">${sub}</h3>
        <div class="muted" style="font-size:0.82rem; margin-bottom:8px;">${(cov.classes_counted || []).join(', ')}</div>
        ${pctBar(cov.average_percentage)}
        <div class="coverage-caption" style="margin-bottom:0;">
          <span>${cov.objectives_covered_total} / ${cov.total_possible} objectives</span>
          <strong>${cov.average_percentage}%</strong>
        </div>
        <div class="class-card__expand-hint" style="margin-top:10px;"><span class="chevron">&#8250;</span> View classes</div>
      </div>`;
  }).join('');
  fillBars(subjectCardsEl);

  // Wire subject-grade card clicks to drill into classes
  subjectCardsEl.querySelectorAll('.subject-grade-card').forEach(card => {
    card.addEventListener('click', () => {
      const subjKey = card.dataset.subject;
      const drilldown = container.querySelector('#subject-drilldown-hd');

      if (drilldown.dataset.activeSubject === subjKey) {
        drilldown.classList.remove('is-open');
        drilldown.dataset.activeSubject = '';
        return;
      }

      // Find classes matching this subject-grade
      let classes = [];
      if (allData) {
        for (const circuit of allData.region.circuits) {
          for (const school of circuit.schools) {
            const dept = school.department;
            if (dept && dept.classes) {
              for (const cls of dept.classes) {
                const clsKey = `${cls.subject} — ${cls.grade}`;
                if (clsKey === subjKey) {
                  classes.push(cls);
                }
              }
            }
          }
        }
      }

      drilldown.classList.add('is-open');
      drilldown.dataset.activeSubject = subjKey;
      drilldown.innerHTML = `
        <h4>${subjKey} — Classes</h4>
        <div class="card-grid card-grid--2">
          ${classes.map(c => `
            <div class="class-card card" style="cursor:default;">
              <div class="class-card__top">
                <div>
                  <div class="class-card__grade">${c.grade} &middot; ${c.subject}</div>
                  <div class="class-card__subject">${c.class_id}</div>
                </div>
                <div class="class-card__size">${c.class_size} learners &middot; ${c.assigned_teacher}</div>
              </div>
              ${tickStrip(c.objectives_covered, c.total_objectives)}
              <div class="coverage-caption">
                <span>Syllabus coverage</span>
                <strong>${c.objectives_covered} / ${c.total_objectives} objectives (${c.syllabus_coverage_percentage}%)</strong>
              </div>
              <div style="margin-top:14px;">
                <div class="section__hint" style="margin-bottom:8px;">Top weak areas</div>
                ${tagRow(c.class_weak_area_summary_top3)}
              </div>
              <div class="class-card__expand-hint"><span class="chevron">&#8250;</span> View learner-level detail</div>
              <div class="class-detail" id="hod-class-learners-${c.class_id}"></div>
            </div>
          `).join('')}
        </div>
        ${classes.length === 0 ? '<p class="muted">No class data found for this subject-grade.</p>' : ''}
      `;

      // Wire class card accordions inside the drilldown
      drilldown.querySelectorAll('.class-card').forEach(clsCard => {
        clsCard.addEventListener('click', function(e) {
          if (e.target.closest('.learner-detail') || e.target.closest('.learner-row__summary')) return;
          clsCard.classList.toggle('is-open');
          const detail = clsCard.querySelector('.class-detail');
          detail.classList.toggle('is-open');
          if (detail.classList.contains('is-open') && !detail.dataset.filled) {
            detail.dataset.filled = '1';
            // Find the class data
            const classId = detail.id.replace('hod-class-learners-', '');
            const classData = classes.find(c => c.class_id === classId);
            if (classData) {
              renderClassLearnerDrilldown(classData, detail);
            }
          }
        });
      });
    });
  });

  // Pending lesson plans
  renderPendingPlans(hv, allData, container);
}

function renderPendingPlans(hv, data, container) {
  const el = container.querySelector('#pending-plans-hd');
  if (!el) return;
  if ((hv.pending_lesson_plans_awaiting_signoff || []).length === 0) {
    el.innerHTML = `<div class="card" style="padding:28px; text-align:center;" class="muted">All lesson plans are signed off.</div>`;
    return;
  }
  el.innerHTML = hv.pending_lesson_plans_awaiting_signoff.map((p, i) => {
    const bd = findLessonPlanBreakdown(data, p.id);
    return `
      <div class="card" style="padding:22px; margin-bottom:16px;" data-plan-id="${p.id}">
        <div style="display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap;">
          <div>
            <div class="muted" style="font-size:0.78rem; text-transform:uppercase; letter-spacing:0.05em;">${p.teacher} &middot; ${p.grade} ${p.subject}</div>
            <div style="font-weight:700; margin-top:4px;">${p.objective_title}</div>
            <div class="muted" style="font-size:0.8rem; margin-top:4px;">Submitted ${p.date_submitted}</div>
          </div>
          <div style="text-align:right;">
            <span class="score-chip" style="font-size:1.6rem;">${p.ai_score}</span>
            <div class="muted" style="font-size:0.75rem;">AI score</div>
          </div>
        </div>
        ${bd ? `
          <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; margin:16px 0;">
            ${[['Alignment', bd.objective_alignment_pct], ['Misconceptions', bd.misconception_coverage_pct], ['Examiner language', bd.examiner_language_pct], ['Cognitive load', bd.cognitive_load_pct]]
              .map(([label, val]) => `
                <div>
                  <div class="muted" style="font-size:0.72rem;">${label}</div>
                  ${pctBar(val)}
                  <div style="font-size:0.78rem; font-weight:700; color:var(--navy);">${val}%</div>
                </div>`).join('')}
          </div>` : ''}
        <div class="btn-row status-row">
          <button class="btn btn--teal btn--sm" data-action="approve">Approve</button>
          <button class="btn btn--ghost btn--sm" data-action="revise">Request revision</button>
        </div>
      </div>`;
  }).join('');
  fillBars(el);

  el.querySelectorAll('.card').forEach(card => {
    const row = card.querySelector('.status-row');
    if (!row) return;
    row.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const approved = btn.dataset.action === 'approve';
        row.innerHTML = statusBadge(approved ? 'approved' : 'needs revision');
        showToast(approved ? 'Lesson plan approved.' : 'Sent back for revision.');
      });
    });
  });
}

function initHod(data) {
  const hv = data.views.hod_view;
  renderHeader('hod', `${hv.school} &nbsp;<span class="sep">/</span>&nbsp; ${hv.department} Department`);
  document.getElementById('hod-name').textContent = hv.hod_name;

  // Remove existing sections/stat-ledger
  const main = document.querySelector('main');
  const statLedger = document.getElementById('stat-ledger');
  if (statLedger) statLedger.remove();
  main.querySelectorAll('.section').forEach(s => s.remove());

  const wrapper = document.createElement('div');
  main.appendChild(wrapper);
  renderHodView(hv, wrapper, data);
}

/* ==========================================================================
   INSPECTOR PAGE — reusable render + page-level init
   ========================================================================== */

function renderInspectorView(inspectorData, container, allData) {
  const iv = inspectorData;
  const avgScore = iv.schools.reduce((s, sc) => s + sc.average_lesson_plan_score, 0) / (iv.schools.length || 1);
  const subjects = Object.keys(iv.schools[0]?.syllabus_coverage_per_subject || {}).sort();
  const avgCoverage = iv.schools.reduce((sum, sc) =>
    sum + subjects.reduce((s2, sub) => s2 + (sc.syllabus_coverage_per_subject[sub]?.average_percentage || 0), 0) / (subjects.length || 1)
  , 0) / (iv.schools.length || 1);
  const topWeakEntries = Object.values(iv.top3_weak_topics_per_subject_circuit_wide || {}).flat().sort((a, b) => b.mentions - a.mentions);
  const topWeak = topWeakEntries[0] || { topic: '—' };

  container.innerHTML = `
    <div class="stat-ledger">
      <div class="stat-ledger__item">
        <span class="stat-ledger__value numeral">${iv.schools.length}</span>
        <span class="stat-ledger__label">Schools in circuit</span>
      </div>
      <div class="stat-ledger__item">
        <span class="stat-ledger__value numeral" id="stat-avg-iv"></span>
        <span class="stat-ledger__label">Circuit avg lesson score</span>
      </div>
      <div class="stat-ledger__item">
        <span class="stat-ledger__value numeral" id="stat-cov-iv"></span>
        <span class="stat-ledger__label">Circuit avg coverage</span>
      </div>
      <div class="stat-ledger__item">
        <span class="stat-ledger__value" style="font-size:1.3rem; font-family:var(--serif); font-weight:700; color:var(--navy);">${topWeak.topic}</span>
        <span class="stat-ledger__label">Top circuit-wide concern</span>
      </div>
    </div>

    <div class="section">
      <div class="section__head">
        <h2>Schools in ${iv.circuit || 'Circuit'}</h2>
        <span class="section__hint">Click a school to see department-level detail</span>
      </div>
      <div class="card-grid card-grid--2" id="school-cards-iv"></div>
    </div>

    <div class="section">
      <div class="section__head">
        <h2>Weak areas across the circuit</h2>
      </div>
      <div class="card-grid card-grid--4" id="circuit-weak-areas-iv"></div>
    </div>
  `;

  const ledger = container.querySelector('.stat-ledger');
  revealLedgerItems(ledger);
  const aiEl = container.querySelector('#stat-avg-iv');
  const covEl = container.querySelector('#stat-cov-iv');
  if (aiEl) animateValue(aiEl, avgScore, { decimals: 1 });
  if (covEl) animateValue(covEl, avgCoverage, { decimals: 1, suffix: '%' });

  // School cards
  const schoolCardsEl = container.querySelector('#school-cards-iv');
  schoolCardsEl.innerHTML = iv.schools.map((sc, i) => `
    <div class="card" style="padding:24px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:10px;">
        <h3 style="font-size:1.15rem; margin-bottom:0;">${sc.name}</h3>
        <div style="text-align:right;">
          <span class="score-chip" style="font-size:1.5rem;">${sc.average_lesson_plan_score}</span>
          <div class="muted" style="font-size:0.75rem;">avg score</div>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:16px;">
        ${subjects.map(sub => {
          const cov = sc.syllabus_coverage_per_subject[sub];
          if (!cov) return '';
          return `<div>
            <div class="muted" style="font-size:0.75rem;">${sub}</div>
            ${pctBar(cov.average_percentage)}
            <div style="font-size:0.78rem; font-weight:700;">${cov.average_percentage}%</div>
          </div>`;
        }).join('')}
      </div>
      <button class="btn btn--ghost btn--sm" data-toggle="${i}">View department detail &nbsp;<span class="chevron">&#8250;</span></button>
      <div class="drilldown" id="drilldown-iv-${i}"></div>
    </div>
  `).join('');
  fillBars(schoolCardsEl);

  // Wire school drilldown to render HOD view
  iv.schools.forEach((sc, i) => {
    const btn = schoolCardsEl.querySelector(`[data-toggle="${i}"]`);
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      const panel = container.querySelector(`#drilldown-iv-${i}`);
      const isOpen = panel.classList.toggle('is-open');
      const chevron = btn.querySelector('.chevron');
      if (chevron) chevron.style.transform = isOpen ? 'rotate(90deg)' : '';
      if (isOpen && !panel.dataset.filled) {
        panel.dataset.filled = '1';
        if (sc.hod_level_drilldown) {
          renderHodView(sc.hod_level_drilldown, panel, allData);
        }
      }
    });
  });

  // Circuit-wide weak topics — now with grade-qualified subjects
  const subj2 = Object.keys(iv.top3_weak_topics_per_subject_circuit_wide || {}).sort();
  const weakAreasEl = container.querySelector('#circuit-weak-areas-iv');
  weakAreasEl.innerHTML = subj2.map(sub => `
    <div class="card" style="padding:18px;">
      <h4 style="font-size:0.95rem; margin-bottom:10px;">${sub}</h4>
      ${weakList(iv.top3_weak_topics_per_subject_circuit_wide[sub])}
    </div>
  `).join('');
}

function initInspector(data) {
  const iv = data.views.inspector_view_circuit_a;
  renderHeader('inspector', `${iv.circuit} &nbsp;<span class="sep">/</span>&nbsp; ${iv.region}`);

  // Remove existing sections/stat-ledger
  const main = document.querySelector('main');
  const statLedger = document.getElementById('stat-ledger');
  if (statLedger) statLedger.remove();
  main.querySelectorAll('.section').forEach(s => s.remove());

  const wrapper = document.createElement('div');
  main.appendChild(wrapper);
  renderInspectorView(iv, wrapper, data);
}

/* ==========================================================================
   SEO PAGE — reusable render + page-level init
   ========================================================================== */

function renderSeoView(seoData, container, allData) {
  const sv = seoData;
  const schoolCount = sv.circuits.reduce((s, c) => s + (c.schools_count || 0), 0);
  const topWeakEntries = Object.values(sv.regional_weak_area_summary_per_subject || {}).flat().sort((a, b) => b.mentions - a.mentions);
  const topWeak = topWeakEntries[0] || { topic: '—' };

  container.innerHTML = `
    <div class="stat-ledger">
      <div class="stat-ledger__item">
        <span class="stat-ledger__value numeral">${sv.circuits.length}</span>
        <span class="stat-ledger__label">Circuits in region</span>
      </div>
      <div class="stat-ledger__item">
        <span class="stat-ledger__value numeral">${schoolCount}</span>
        <span class="stat-ledger__label">Schools reporting</span>
      </div>
      <div class="stat-ledger__item">
        <span class="stat-ledger__value numeral" id="stat-avg-sv"></span>
        <span class="stat-ledger__label">Regional avg lesson score</span>
      </div>
      <div class="stat-ledger__item">
        <span class="stat-ledger__value" style="font-size:1.3rem; font-family:var(--serif); font-weight:700; color:var(--navy);">${topWeak.topic}</span>
        <span class="stat-ledger__label">Top regional concern</span>
      </div>
    </div>

    <div class="section">
      <div class="section__head">
        <h2>Circuits in ${sv.region || 'Region'}</h2>
        <span class="section__hint">Click a circuit to see inspector-level detail</span>
      </div>
      <div class="card-grid card-grid--2" id="circuit-cards-sv"></div>
    </div>

    <div class="section">
      <div class="section__head">
        <h2>Regional syllabus performance</h2>
      </div>
      <div class="card-grid card-grid--4" id="regional-subjects-sv"></div>
    </div>

    <div class="section">
      <div class="section__head">
        <h2>Weak area heatmap</h2>
        <span class="section__hint">Top 3 topics per subject, region-wide</span>
      </div>
      <div id="heatmap-sv"></div>
    </div>
  `;

  const ledger = container.querySelector('.stat-ledger');
  revealLedgerItems(ledger);
  const aiEl = container.querySelector('#stat-avg-sv');
  if (aiEl) animateValue(aiEl, sv.regional_average_lesson_plan_score, { decimals: 1 });

  // Circuit cards
  const circuitCardsEl = container.querySelector('#circuit-cards-sv');
  circuitCardsEl.innerHTML = sv.circuits.map((c, i) => `
    <div class="card" style="padding:24px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:14px;">
        <div>
          <h3 style="font-size:1.15rem; margin-bottom:2px;">${c.name}</h3>
          <div class="muted" style="font-size:0.82rem;">${c.schools_count} schools</div>
        </div>
        <div style="text-align:right;">
          <span class="score-chip" style="font-size:1.5rem;">${c.average_lesson_plan_score}</span>
          <div class="muted" style="font-size:0.75rem;">avg score</div>
        </div>
      </div>
      <button class="btn btn--ghost btn--sm" data-toggle="${i}">View circuit detail &nbsp;<span class="chevron">&#8250;</span></button>
      <div class="drilldown" id="circuit-drilldown-sv-${i}"></div>
    </div>
  `).join('');

  // Wire circuit drilldown to render Inspector view
  sv.circuits.forEach((c, i) => {
    const btn = circuitCardsEl.querySelector(`[data-toggle="${i}"]`);
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      const panel = container.querySelector(`#circuit-drilldown-sv-${i}`);
      const isOpen = panel.classList.toggle('is-open');
      const chevron = btn.querySelector('.chevron');
      if (chevron) chevron.style.transform = isOpen ? 'rotate(90deg)' : '';
      if (isOpen && !panel.dataset.filled) {
        panel.dataset.filled = '1';
        if (c.inspector_level_drilldown) {
          renderInspectorView(c.inspector_level_drilldown, panel, allData);
        }
      }
    });
  });

  // Regional subject performance — grade-qualified
  const subjects = Object.keys(sv.regional_weak_area_summary_per_subject || {}).sort();
  const allSchools = sv.circuits.flatMap(c => {
    const drilldown = c.inspector_level_drilldown;
    return drilldown ? (drilldown.schools || []) : [];
  });
  
  const regionalSubjectsEl = container.querySelector('#regional-subjects-sv');
  regionalSubjectsEl.innerHTML = subjects.map(sub => {
    let covered = 0, possible = 0;
    allSchools.forEach(sc => {
      const cov = sc.syllabus_coverage_per_subject[sub];
      if (cov) {
        covered += cov.objectives_covered_total || 0;
        possible += cov.total_possible || 0;
      }
    });
    const pct = possible > 0 ? Math.round((covered / possible) * 1000) / 10 : 0;
    return `
      <div class="card" style="padding:20px;">
        <div style="font-weight:700; margin-bottom:8px;">${sub}</div>
        ${pctBar(pct)}
        <div class="coverage-caption"><span>${covered} / ${possible} objectives</span><strong>${pct}%</strong></div>
      </div>`;
  }).join('');
  fillBars(regionalSubjectsEl);

  // Heatmap
  const heatmapEl = container.querySelector('#heatmap-sv');
  heatmapEl.innerHTML = subjects.map(sub => {
    const cells = sv.regional_weak_area_summary_per_subject[sub] || [];
    const shades = ['var(--navy)', 'var(--teal)', 'var(--orange)'];
    return `
      <div class="heatmap-row">
        <div class="heatmap-row__label">${sub}</div>
        ${cells.map((c, i) => `
          <div class="heatmap-cell" style="background:${shades[i] || shades[2]};">
            <span class="n">${c.mentions}</span>
            <span>${c.topic}</span>
          </div>`).join('')}
      </div>`;
  }).join('');
}

function initSeo(data) {
  const sv = data.views.seo_view_region;
  renderHeader('seo', `${sv.region} Region`);

  // Remove existing sections/stat-ledger
  const main = document.querySelector('main');
  const statLedger = document.getElementById('stat-ledger');
  if (statLedger) statLedger.remove();
  main.querySelectorAll('.section').forEach(s => s.remove());

  const wrapper = document.createElement('div');
  main.appendChild(wrapper);
  renderSeoView(sv, wrapper, data);
}

/* ==========================================================================
   INDEX PAGE (role switcher only, cards are static markup)
   ========================================================================== */

function initIndex(data) {
  renderHeader(null, null);
  document.querySelectorAll('.role-card .scope-grid-slot').forEach(slot => {
    slot.innerHTML = scopeGridHTML(slot.dataset.role);
  });
}

/* ==========================================================================
   Router
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  loadData().then(data => {
    switch (page) {
      case 'index': initIndex(data); break;
      case 'teacher': initTeacher(data); break;
      case 'lesson-plan': initLessonPlan(data); break;
      case 'hod': initHod(data); break;
      case 'inspector': initInspector(data); break;
      case 'seo': initSeo(data); break;
    }
  }).catch(err => {
    console.error(err);
    renderLoadError(document.querySelector('main') || document.body);
  });
});
