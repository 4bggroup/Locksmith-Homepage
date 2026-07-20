(() => {
  'use strict';

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  document.body.classList.add('is-loading');
  const loader = qs('#siteLoader');
  const hideLoader = () => {
    window.setTimeout(() => {
      loader?.classList.add('hidden');
      document.body.classList.remove('is-loading');
    }, 850);
  };
  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader, { once: true });

  // Header and mobile navigation.
  const header = qs('#siteHeader');
  const menuToggle = qs('#menuToggle');
  const primaryNav = qs('#primaryNav');
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 18);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  menuToggle?.addEventListener('click', () => {
    const open = primaryNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  qsa('a', primaryNav).forEach(link => link.addEventListener('click', () => {
    primaryNav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }));

  // Reveal animation.
  const revealItems = qsa('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('visible'));
  }

  // Hero rescue console.
  let heroStep = 1;
  let heroIssue = '';
  let heroPostcode = '';
  let heroAttendance = '';
  const heroSteps = qsa('[data-hero-step]');
  const progressBars = qsa('.console-progress span');
  const heroNext = qs('#heroNext');
  const heroBack = qs('#heroBack');
  const heroStepNumber = qs('#heroStepNumber');
  const heroPostcodeInput = qs('#heroPostcode');
  const coverageResult = qs('#coverageResult');

  const renderHeroStep = () => {
    heroSteps.forEach(step => step.classList.toggle('active', Number(step.dataset.heroStep) === heroStep));
    progressBars.forEach((bar, index) => bar.classList.toggle('active', index < heroStep));
    heroStepNumber.textContent = String(heroStep).padStart(2, '0');
    heroBack.disabled = heroStep === 1;
    heroNext.innerHTML = heroStep === 3 ? 'Open full booking <span>↗</span>' : 'Continue <span>→</span>';
  };

  qsa('#heroIssueGrid button').forEach(button => {
    button.addEventListener('click', () => {
      qsa('#heroIssueGrid button').forEach(item => item.classList.remove('selected'));
      button.classList.add('selected');
      heroIssue = button.dataset.value;
    });
  });

  const checkCoverage = () => {
    const value = heroPostcodeInput.value.trim();
    heroPostcode = value;
    coverageResult.className = 'coverage-result';
    if (!/^\d{4}$/.test(value)) {
      coverageResult.textContent = 'Please enter a valid four-digit Australian postcode.';
      coverageResult.classList.add('error');
      return false;
    }
    const n = Number(value);
    const demoCovered = (n >= 2000 && n <= 2234) || (n >= 2060 && n <= 2108) || (n >= 2110 && n <= 2155);
    if (demoCovered) {
      coverageResult.innerHTML = '<strong>Demo coverage confirmed.</strong> A live build would now show service availability for this suburb.';
      coverageResult.classList.add('success');
      return true;
    }
    coverageResult.innerHTML = '<strong>Manual coverage check required.</strong> The business can still receive the request and confirm attendance.';
    coverageResult.classList.add('error');
    return true;
  };
  qs('#checkPostcode')?.addEventListener('click', checkCoverage);

  qsa('[data-attendance]').forEach(button => {
    button.addEventListener('click', () => {
      qsa('[data-attendance]').forEach(item => item.classList.remove('selected'));
      button.classList.add('selected');
      heroAttendance = button.dataset.attendance;
    });
  });

  heroNext?.addEventListener('click', () => {
    if (heroStep === 1 && !heroIssue) {
      qsa('#heroIssueGrid button')[0]?.focus();
      return;
    }
    if (heroStep === 2 && !checkCoverage()) return;
    if (heroStep === 3) {
      const serviceMatch = qsa('input[name="service"]').find(input => {
        const value = input.value.toLowerCase();
        if (heroIssue.toLowerCase().includes('car')) return value.includes('automotive');
        if (heroIssue.toLowerCase().includes('planned')) return value.includes('smart');
        if (heroIssue.toLowerCase().includes('damaged')) return value.includes('repair');
        return value.includes('emergency');
      });
      if (serviceMatch) serviceMatch.checked = true;
      if (heroAttendance) {
        const attendanceInput = qsa('input[name="attendance"]').find(input => input.value === heroAttendance);
        if (attendanceInput) {
          attendanceInput.checked = true;
          attendanceInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      const bookingPostcode = qs('input[name="postcode"]');
      if (bookingPostcode && heroPostcode) bookingPostcode.value = heroPostcode;
      qs('#booking')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    heroStep += 1;
    renderHeroStep();
  });
  heroBack?.addEventListener('click', () => {
    if (heroStep > 1) heroStep -= 1;
    renderHeroStep();
  });

  // Process visual selector.
  const processItems = qsa('[data-process]');
  let processTimer;
  const activateProcess = index => {
    processItems.forEach((item, i) => item.classList.toggle('active', i === index));
  };
  processItems.forEach((item, index) => item.addEventListener('click', () => {
    activateProcess(index);
    window.clearInterval(processTimer);
  }));
  let processIndex = 0;
  processTimer = window.setInterval(() => {
    processIndex = (processIndex + 1) % processItems.length;
    activateProcess(processIndex);
  }, 3200);

  // Booking wizard.
  let bookingStep = 1;
  const bookingSteps = qsa('[data-booking-step]');
  const bookingNav = qsa('[data-booking-nav]');
  const bookingNext = qs('#bookingNext');
  const bookingBack = qs('#bookingBack');
  const bookingForm = qs('#bookingForm');
  const formError = qs('#formError');
  const scheduleFields = qs('#scheduleFields');
  const bookingSummary = qs('#bookingSummary');
  const successModal = qs('#successModal');

  const showError = message => {
    formError.textContent = message;
    formError.classList.add('visible');
  };
  const clearError = () => formError.classList.remove('visible');

  const renderBookingStep = () => {
    bookingSteps.forEach(step => step.classList.toggle('active', Number(step.dataset.bookingStep) === bookingStep));
    bookingNav.forEach((button, index) => {
      button.classList.toggle('active', index + 1 === bookingStep);
      button.classList.toggle('complete', index + 1 < bookingStep);
    });
    bookingBack.disabled = bookingStep === 1;
    bookingNext.innerHTML = bookingStep === 4 ? 'Send demo request <span>↗</span>' : 'Continue <span>→</span>';
    clearError();
  };

  const getCheckedValue = name => qs(`input[name="${name}"]:checked`)?.value || '';
  const validateBookingStep = step => {
    if (step === 1 && !getCheckedValue('service')) {
      showError('Choose the service that best matches the job.');
      return false;
    }
    if (step === 2) {
      const required = ['name', 'phone', 'postcode', 'address', 'details'];
      for (const name of required) {
        const field = bookingForm.elements[name];
        if (!field?.value.trim()) {
          showError('Complete all required job and contact details.');
          field?.focus();
          return false;
        }
      }
      if (!/^\d{4}$/.test(bookingForm.elements.postcode.value.trim())) {
        showError('Enter a valid four-digit Australian postcode.');
        bookingForm.elements.postcode.focus();
        return false;
      }
    }
    if (step === 3 && !getCheckedValue('attendance')) {
      showError('Choose emergency attendance or a scheduled visit.');
      return false;
    }
    if (step === 4 && !bookingForm.elements.terms.checked) {
      showError('Confirm the details before sending the demonstration request.');
      return false;
    }
    return true;
  };

  const buildSummary = () => {
    const data = new FormData(bookingForm);
    const rows = [
      ['Service', data.get('service') || 'Not selected'],
      ['Customer', data.get('name') || 'Not provided'],
      ['Phone', data.get('phone') || 'Not provided'],
      ['Location', `${data.get('address') || 'Not provided'}${data.get('postcode') ? `, ${data.get('postcode')}` : ''}`],
      ['Attendance', data.get('attendance') || 'Not selected'],
      ['Preferred time', data.get('attendance') === 'Schedule a visit' ? `${data.get('date') || 'Date to confirm'} • ${data.get('time') || 'Time to confirm'}` : 'Immediate contact requested'],
      ['Photo', qs('#photoInput')?.files?.[0]?.name || 'No attachment']
    ];
    bookingSummary.innerHTML = rows.map(([key, value]) => `<dl><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(String(value))}</dd></dl>`).join('');
  };

  bookingNext?.addEventListener('click', () => {
    if (!validateBookingStep(bookingStep)) return;
    if (bookingStep < 4) {
      bookingStep += 1;
      if (bookingStep === 4) buildSummary();
      renderBookingStep();
      qs('.booking-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const ref = `HL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    qs('#successReference').textContent = `Reference: ${ref}`;
    successModal.classList.add('visible');
    successModal.setAttribute('aria-hidden', 'false');
    qs('#closeSuccess')?.focus();
  });

  bookingBack?.addEventListener('click', () => {
    if (bookingStep > 1) bookingStep -= 1;
    renderBookingStep();
  });

  bookingNav.forEach(button => button.addEventListener('click', () => {
    const target = Number(button.dataset.bookingNav);
    if (target <= bookingStep) {
      bookingStep = target;
      renderBookingStep();
    }
  }));

  qsa('input[name="attendance"]').forEach(input => input.addEventListener('change', () => {
    scheduleFields.classList.toggle('visible', input.checked && input.value === 'Schedule a visit');
  }));

  const dateInput = qs('#bookingDate');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().slice(0, 10);
  }

  const photoInput = qs('#photoInput');
  photoInput?.addEventListener('change', () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    qs('#uploadTitle').textContent = file.name;
    qs('#uploadText').textContent = `${Math.max(0.1, file.size / 1024 / 1024).toFixed(1)} MB attached to this demonstration request.`;
    qs('#uploadZone').style.borderColor = '#7ea600';
  });

  const closeSuccess = () => {
    successModal.classList.remove('visible');
    successModal.setAttribute('aria-hidden', 'true');
  };
  qs('#closeSuccess')?.addEventListener('click', closeSuccess);
  qs('#doneSuccess')?.addEventListener('click', closeSuccess);
  successModal?.addEventListener('click', event => {
    if (event.target === successModal) closeSuccess();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && successModal.classList.contains('visible')) closeSuccess();
  });

  // Estimator.
  const estimateService = qs('#estimateService');
  const estimateTime = qs('#estimateTime');
  const estimateAmount = qs('#estimateAmount');
  const estimateNote = qs('#estimateNote');
  const ranges = {
    lockout: { standard: '$160–$260', after: '$240–$390', note: 'Access method, lock condition and attendance time can change the final amount.' },
    rekey: { standard: '$145–$240', after: '$220–$340', note: 'The number of cylinders, key quantity and lock type affect final pricing.' },
    repair: { standard: '$180–$340', after: '$270–$480', note: 'Parts, door alignment and damage are confirmed before repair work proceeds.' },
    car: { standard: '$170–$320', after: '$260–$460', note: 'Vehicle make, model, key type and access complexity determine the final quote.' },
    commercial: { standard: 'Site assessment', after: 'Priority assessment', note: 'Commercial access control and master key systems require a scoped quotation.' }
  };
  const updateEstimate = () => {
    const service = estimateService.value;
    const timing = estimateTime.value;
    const result = ranges[service][timing];
    estimateAmount.textContent = result;
    estimateNote.textContent = ranges[service].note;
  };
  estimateService?.addEventListener('change', updateEstimate);
  estimateTime?.addEventListener('change', updateEstimate);

  // Area checker.
  qs('#areaCheckButton')?.addEventListener('click', () => {
    const input = qs('#areaPostcode');
    const message = qs('#areaMessage');
    const value = input.value.trim();
    if (!/^\d{4}$/.test(value)) {
      message.textContent = 'Enter a valid four-digit Australian postcode.';
      message.style.color = '#8c2d0d';
      return;
    }
    const n = Number(value);
    const covered = (n >= 2000 && n <= 2234) || (n >= 2060 && n <= 2155);
    message.textContent = covered
      ? 'Demo result: this postcode falls within the example Sydney coverage area. A live build would show current availability.'
      : 'Demo result: send the request for a manual coverage check. A live build would use the locksmith’s real suburb rules.';
    message.style.color = covered ? '#536c00' : '#7a5312';
  });

  // FAQ accordion.
  qsa('.faq-list article').forEach(article => {
    const button = qs('button', article);
    button.addEventListener('click', () => {
      const wasOpen = article.classList.contains('open');
      qsa('.faq-list article').forEach(item => {
        item.classList.remove('open');
        qs('button', item).setAttribute('aria-expanded', 'false');
        qs('button i', item).textContent = '＋';
      });
      if (!wasOpen) {
        article.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
        qs('i', button).textContent = '−';
      }
    });
  });

  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
  }
})();
