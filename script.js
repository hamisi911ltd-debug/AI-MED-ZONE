/* ═══════════════════════════════════════════════════════════════
   AMZ MedAI Zone | Main Script
   AI Education for Healthcare Professionals
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── HERO SLIDESHOW ── */
(function initSlideshow() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.slide-dot');
  if (!slides.length) return;

  let current = 0, timer;

  function goTo(idx) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
  }

  function next() { goTo(current + 1); }

  function start() { timer = setInterval(next, 4500); }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      clearInterval(timer);
      goTo(+dot.dataset.index);
      start();
    });
  });

  start();
})();


/* ── HERO CANVAS PARTICLE SYSTEM ── */
(function initCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animId;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.r  = Math.random() * 2.5 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.45;
      this.vy = (Math.random() - 0.5) * 0.45;
      this.a  = Math.random() * 0.6 + 0.2;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < -10) this.x = W + 10;
      if (this.x > W + 10) this.x = -10;
      if (this.y < -10) this.y = H + 10;
      if (this.y > H + 10) this.y = -10;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(79,126,255,${this.a})`;
      ctx.fill();
    }
  }

  function init() {
    resize();
    const count = Math.floor((W * H) / 14000);
    particles = Array.from({ length: count }, () => new Particle());
  }

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,201,167,${0.15 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    animId = requestAnimationFrame(animate);
  }

  init(); animate();
  window.addEventListener('resize', () => { cancelAnimationFrame(animId); init(); animate(); });
})();


/* ── NAVBAR: SCROLL & ACTIVE LINK ── */
(function initNavbar() {
  const navbar   = document.getElementById('navbar');
  const links    = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  function onScroll() {
    if (window.scrollY > 60) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    links.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ── HAMBURGER MENU ── */
(function initHamburger() {
  const btn   = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('active');
    links.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  links.querySelectorAll('.nav-link').forEach(l => {
    l.addEventListener('click', () => {
      btn.classList.remove('active');
      links.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();


/* ── SCROLL REVEAL ── */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => entry.target.classList.add('visible'), +delay);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
})();


/* ── ANIMATED COUNTERS ── */
(function initCounters() {
  const nums = document.querySelectorAll('.stat-num');
  if (!nums.length) return;

  function animateCounter(el) {
    const target   = +el.dataset.target;
    const duration = 2000;
    const step     = target / (duration / 16);
    let current    = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString();
      if (current >= target) clearInterval(timer);
    }, 16);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { animateCounter(entry.target); io.unobserve(entry.target); }
    });
  }, { threshold: 0.5 });

  nums.forEach(el => io.observe(el));
})();


/* ── COURSE FILTER ── */
(function initCourseFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards      = document.querySelectorAll('.course-card');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
      });
    });
  });
})();


/* ── TESTIMONIALS CAROUSEL ── */
(function initTestimonials() {
  const track         = document.getElementById('testimonialsTrack');
  const prevBtn       = document.getElementById('tPrev');
  const nextBtn       = document.getElementById('tNext');
  const dotsContainer = document.getElementById('tDots');
  if (!track) return;

  const cards = track.querySelectorAll('.tcard');
  let current = 0, autoTimer;

  function getVisibleCount() {
    return window.innerWidth < 768 ? 1 : window.innerWidth < 1100 ? 2 : 3;
  }
  function getMaxIndex() { return Math.max(0, cards.length - getVisibleCount()); }

  function buildDots() {
    dotsContainer.innerHTML = '';
    const max = getMaxIndex() + 1;
    for (let i = 0; i < max; i++) {
      const btn = document.createElement('button');
      btn.className = 't-dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Slide ${i + 1}`);
      btn.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(btn);
    }
  }

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, getMaxIndex()));
    const cardWidth = cards[0].offsetWidth + 24;
    track.style.transform = `translateX(-${current * cardWidth}px)`;
    dotsContainer.querySelectorAll('.t-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function next() { goTo(current >= getMaxIndex() ? 0 : current + 1); }
  function prev() { goTo(current <= 0 ? getMaxIndex() : current - 1); }
  function startAuto() { clearInterval(autoTimer); autoTimer = setInterval(next, 5000); }

  prevBtn?.addEventListener('click', () => { prev(); startAuto(); });
  nextBtn?.addEventListener('click', () => { next(); startAuto(); });

  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', startAuto);

  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    startAuto();
  });

  window.addEventListener('resize', () => { buildDots(); goTo(current); });
  buildDots(); startAuto();
})();


/* ── FAQ ACCORDION ── */
(function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      items.forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
      btn.setAttribute('aria-expanded', !isOpen);
    });
  });
})();


/* ── CONTACT FORM ── */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  function validate(id, errorId, check, msg) {
    const el  = document.getElementById(id);
    const err = document.getElementById(errorId);
    const ok  = check(el.value.trim());
    el.classList.toggle('error', !ok);
    err.textContent = ok ? '' : msg;
    return ok;
  }

  function setBtn(btn, loading) {
    btn.disabled = loading;
    btn.querySelector('.btn-text').textContent = loading ? 'Submitting…' : 'Create Account';
  }

  function saveToLocalStorage(data) {
    try {
      const existing = JSON.parse(localStorage.getItem('amz_enrollments') || '[]');
      existing.push({ ...data, submitted_at: new Date().toISOString() });
      localStorage.setItem('amz_enrollments', JSON.stringify(existing));
    } catch (e) { /* storage may be unavailable */ }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const v1 = validate('firstName', 'firstNameError', v => v.length >= 2, 'Please enter your first name.');
    const v2 = validate('lastName',  'lastNameError',  v => v.length >= 2, 'Please enter your last name.');
    const v3 = validate('email',     'emailError',     v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Please enter a valid email.');
    const v4 = validate('service',   'serviceError',   v => v !== '',       'Please select your role.');
    if (!v1 || !v2 || !v3 || !v4) return;

    const btn = form.querySelector('.btn-primary');
    setBtn(btn, true);

    const payload = {
      first_name: document.getElementById('firstName').value.trim(),
      last_name:  document.getElementById('lastName').value.trim(),
      email:      document.getElementById('email').value.trim(),
      role:       document.getElementById('service').value,
      message:    document.getElementById('message').value.trim(),
      site:       'AMZ MedAI Zone',
      submitted:  new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })
    };

    saveToLocalStorage(payload);

    const ejsReady = typeof emailjs !== 'undefined' &&
                     window.AMZ_EJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';

    if (ejsReady) {
      emailjs.send(window.AMZ_EJS_SERVICE_ID, window.AMZ_EJS_TEMPLATE_ID, payload)
        .then(() => {
          setBtn(btn, false);
          form.reset();
          showToast('Enrolled! Check your email for your welcome message.');
        })
        .catch(() => {
          setBtn(btn, false);
          showToast('Enrolled! We\'ll be in touch shortly at ' + payload.email);
        });
    } else {
      setTimeout(() => {
        setBtn(btn, false);
        form.reset();
        showToast('Enrolled! We\'ll contact you at ' + payload.email + ' to complete onboarding.');
      }, 1400);
    }
  });
})();


/* ── NEWSLETTER FORM ── */
(function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail').value.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      try {
        const subs = JSON.parse(localStorage.getItem('amz_subscribers') || '[]');
        if (!subs.includes(email)) { subs.push(email); localStorage.setItem('amz_subscribers', JSON.stringify(subs)); }
      } catch(e) {}
      form.reset();
      showToast('Subscribed! Welcome to the AMZ MedAI Zone community.');
    }
  });
})();


/* ── TOAST ── */
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3800);
}
window.showToast = showToast;


/* ══════════════════════════════════════════════════════════════
   AMZ AI MENTOR CHATBOT — Education-focused knowledge base
══════════════════════════════════════════════════════════════ */
const AIMentor = (function () {

  const KB = [
    {
      id: 'greeting',
      keywords: ['hello','hi','hey','good morning','good afternoon','good evening','greetings','start','howdy'],
      response: `Hello! I'm your **AMZ AI Mentor** 👋 — here to guide you through our 10-week AI in Healthcare programme, explain the curriculum, and help you find the right track.\n\nWhat would you like to explore today?`,
      suggestions: ['What does the 10-week curriculum cover?', 'Which track is right for me?', 'How does AI help doctors?', 'What is the capstone project?']
    },
    {
      id: 'curriculum',
      keywords: ['curriculum','10 week','10-week','syllabus','what do you teach','course outline','modules','week by week','what is covered','programme content','schedule','topics covered','full programme','all weeks'],
      response: `**AMZ MedAI Zone — 10-Week Curriculum Overview:**\n\n**Week 01 · Introduction to AI in Healthcare & African Contexts**\n→ Define AI, ML, and deep learning\n→ African healthcare landscape & challenges\n→ AI success stories: Uganda, Kenya, Egypt\n\n**Week 02 · Fundamentals of Data Science & Statistics**\n→ Healthcare data types: structured, imaging, genomic\n→ Sensitivity, specificity, AUC-ROC\n→ Data quality, bias, and African data gaps\n\n**Week 03 · Machine Learning Basics**\n→ ML paradigms and common algorithms\n→ Supervised & unsupervised learning\n→ The ML workflow: training, validation, testing\n\n**Week 04 · AI Ethics — Decolonised & African Perspectives**\n→ WHO, EU AI Act, OECD frameworks critiqued\n→ Ubuntu philosophy and the CARE framework\n→ Ethical dilemma debate: African healthcare scenarios\n\n**Week 05 · Data Handling, Privacy & Governance**\n→ Kenya Data Protection Act 2019 applied\n→ Privacy-preserving techniques: federated learning\n→ Data governance and community-based models\n\n**Week 06 · Diagnostic Algorithms & CDSS**\n→ Pattern recognition and explainability\n→ CDSS types and integration challenges\n→ Case study: evaluating a malaria diagnostic AI\n\n**Week 07 · Medical Imaging & AI**\n→ CNNs, transfer learning, image classification\n→ Radiology, pathology, ophthalmology, obstetric ultrasound\n→ Image interpretation lab: AI vs. expert radiologist\n\n**Week 08 · Public Health Applications & Surveillance**\n→ AI for outbreak prediction, maternal & child health\n→ NCD risk, supply chain, and workforce AI\n→ Simulation: managing a cholera outbreak with AI tools\n\n**Week 09 · Practical AI Tools, NLP & LLMs**\n→ AI platforms for clinical and research use\n→ NLP for ICD coding and adverse event detection\n→ Multilingual NLP: Kiswahili and African languages\n\n**Week 10 · Ethics, Regulation, Future of AI & Capstone**\n→ Kenya National AI Strategy, KMPDC, WHO Ethics frameworks\n→ Career positioning: research, clinical exposure, AI literacy\n→ Capstone project presentations to expert panel`,
      suggestions: ['Enrol in the full programme', 'Tell me about Week 7 Imaging', 'AI Ethics Week 4', 'What is the capstone project?']
    },
    {
      id: 'getting_started',
      keywords: ['how to start','get started','sign up','register','create account','join','onboard','begin','new here','where do i start'],
      response: `**Getting started is straightforward:**\n\n**Step 1 — Enrol →** Fill in the enrolment form on this page (scroll to the Enrol section)\n\n**Step 2 — Verify →** Confirm your healthcare background — this unlocks all accredited CPD content\n\n**Step 3 — Choose your track →**\n• Complete 10-Week Programme (flagship, all roles)\n• Foundations only (Weeks 1–3) — great if you want to start with AI basics\n• Ethics & Governance (Weeks 4–5) — if you need compliance knowledge fast\n• Clinical AI (Weeks 6–7) — for clinicians using diagnostic/imaging tools\n• Or start at Week 1 and follow the full journey\n\n**Step 4 — Learn →** Modules are published weekly by our academic team. Start with what's live and progress as new content drops.\n\nNo coding background needed — just curiosity and commitment to better patient care.`,
      suggestions: ['Full 10-week curriculum', 'Which track is right for me?', 'Do I need to know coding?', 'Certificates and CPD hours']
    },
    {
      id: 'no_coding',
      keywords: ['coding','programming','python','math','technical','data science','engineer','no background','non-technical','do i need'],
      response: `**You do not need any coding or maths background.** 🙌\n\nOur courses are built for clinicians — we explain everything in clinical language you already understand.\n\n• "Training data" → like a junior doctor learning from thousands of cases\n• "Algorithm" → like a diagnostic protocol\n• "Neural network" → like the pattern recognition your brain already does\n\nIf you can interpret a lab report or read a clinical guideline, you can complete our courses. We handle the maths — you focus on applying AI to patient care.\n\nThe **beginner paths** (AI Ethics, Reading AI Dashboards) require zero technical knowledge at all.`,
      suggestions: ['Which course should I start with?', 'What is machine learning?', 'AI Diagnostics course', 'Beginner learning paths']
    },
    {
      id: 'learning_paths',
      keywords: ['learning path','course path','program','track','specialty','which course','what to study','pathway','which track'],
      response: `**AMZ MedAI Zone — Learning Tracks:**\n\nAll tracks draw from the same accredited 10-week curriculum:\n\n🎓 **Complete 10-Week Programme** *(Flagship)* — 10 modules, ~80 hrs, All Levels\n🌱 **AI Foundations** *(Weeks 1–3)* — 3 modules, 24 hrs, Beginner\n   → AI/ML basics, data science, statistics, ML workflow\n⚖️ **Ethics & Data Governance** *(Weeks 4–5)* — 2 modules, 16 hrs, All Levels\n   → Ubuntu/CARE ethics, Kenya Data Protection Act, federated learning\n🩺 **Clinical AI Applications** *(Weeks 6–7)* — 2 modules, 16 hrs, Intermediate\n   → CDSS, malaria AI, medical imaging, radiology, obstetric ultrasound\n🌍 **Public Health & Surveillance AI** *(Week 8)* — 1 module, 8 hrs, Intermediate\n   → Outbreak prediction, MCH AI, cholera simulation\n🤖 **AI Tools, NLP & Capstone** *(Weeks 9–10)* — 2 modules, 16 hrs, Advanced\n   → NLP, LLMs, Kiswahili AI, capstone to expert panel\n\nFor the full curriculum week-by-week, ask me "What does the curriculum cover?"`,
      suggestions: ['Full 10-week curriculum', 'I am a radiologist', 'I am a nurse', 'What is the capstone project?']
    },
    {
      id: 'for_radiologist',
      keywords: ['radiologist','radiology','imaging','x-ray','xray','ct scan','mri','ultrasound','scan','picture archiving'],
      response: `**For Radiologists — your recommended module:**\n\n📡 **Week 07 · Medical Imaging & AI** *(peak week for radiologists)*\n   → CNNs and transfer learning for image classification\n   → Radiology, pathology, ophthalmology & obstetric ultrasound AI\n   → Hands-on lab: AI vs. expert radiologist interpretation\n   → Chest X-ray pneumonia detection, retinal grading, fetal biometry\n\nTo get the most from Week 07, we recommend completing:\n• **Week 01** — AI & ML fundamentals (context for imaging models)\n• **Week 04** — Ethics & explainability (critical for AI-assisted reporting)\n• **Week 05** — Data privacy & governance (patient data in imaging pipelines)\n\nAll covered in the **Complete 10-Week Programme** or the **Clinical AI Track (Weeks 6–7)**.`,
      suggestions: ['Enrol in full programme', 'Clinical AI track Weeks 6-7', 'What is the capstone project?', 'AI Ethics Week 4']
    },
    {
      id: 'for_nurse',
      keywords: ['nurse','nursing','ward','midwife','clinical nurse','sister','matron','healthcare worker','allied health'],
      response: `**For Nurses & Allied Health Professionals:**\n\nYour most relevant weeks in the 10-week curriculum:\n\n🌱 **Week 01 · Introduction to AI in Healthcare**\n   → What AI is (and isn't) — jargon-free for all clinical roles\n   → African healthcare landscape and where AI fits on the ward\n\n⚖️ **Week 05 · Data Handling, Privacy & Governance**\n   → Kenya Data Protection Act 2019 — your responsibilities as a nurse\n   → Patient consent for AI tools\n   → Practical: what to do if a patient's AI monitoring alert fires\n\n🌍 **Week 08 · Public Health & Surveillance AI**\n   → MCH and maternal health AI most relevant to nursing practice\n   → AI tools for supply chain and ward resource management\n\nAll content is mobile-first — modules designed for busy ward schedules and low-bandwidth environments.`,
      suggestions: ['Enrol in full programme', 'Week 5 data privacy', 'Maternal health AI Week 8', 'What is the capstone?']
    },
    {
      id: 'for_gp',
      keywords: ['general practitioner','gp','family doctor','primary care','community health','general medicine','internist'],
      response: `**For General Practitioners & Primary Care Physicians:**\n\nYour core weeks in the 10-week curriculum:\n\n🩺 **Week 06 · Diagnostic Algorithms & CDSS** *(most relevant for GPs)*\n   → Clinical Decision Support Systems in primary care\n   → AI-assisted triage, referral decision support\n   → Pattern recognition and explainability (when to override AI)\n   → Case study: evaluating a malaria diagnostic AI tool\n\n⚖️ **Week 04 · AI Ethics — African Perspectives**\n   → Informed consent when AI assists your decisions\n   → Ubuntu philosophy in patient-centred AI care\n\n🌍 **Week 08 · Public Health & Surveillance AI**\n   → NCD risk stratification tools\n   → MCH AI applicable to community health settings\n\nGPs encounter the widest range of AI tools — the Complete 10-Week Programme gives the broadest foundation.`,
      suggestions: ['Enrol in full programme', 'CDSS Week 6', 'AI Ethics Week 4', 'Time commitment?']
    },
    {
      id: 'for_student',
      keywords: ['student','intern','junior doctor','medical student','house officer','foundation','residency','trainee'],
      response: `**For Medical Students & Junior Doctors:**\n\nYou're entering medicine at the perfect time — AI will be part of your entire career. The 10-week curriculum is built with you in mind:\n\n🌱 **Start with Foundations (Weeks 1–3):**\n• Week 01 — AI/ML concepts and African healthcare context\n• Week 02 — Data science & biostatistics for health AI (AUC-ROC, sensitivity, specificity)\n• Week 03 — ML workflow: training, validation, testing\n\n⚖️ **Then Ethics (Weeks 4–5):**\n• Week 04 — Decolonised AI ethics (required knowledge for modern clinicians)\n• Week 05 — Kenya Data Protection Act — your legal obligations from day one\n\n🏆 **Complete all 10 weeks and present a Capstone project** to an expert panel — a powerful addition to your CV, portfolio, or research profile.\n\nAMZ MedAI Zone certificates are aligned with KMPDC, AMA, and GMC continuing education standards.`,
      suggestions: ['Enrol in full programme', 'Foundations track Weeks 1-3', 'What is the capstone?', 'Certificates and accreditation']
    },
    {
      id: 'ai_radiology',
      keywords: ['ai radiology','chest xray ai','ct ai','mri ai','radiology ai','image recognition','cnn','convolutional','deep learning radiology'],
      response: `**AI in Radiology** — covered in **Week 07 · Medical Imaging & AI** of the AMZ MedAI Zone curriculum:\n\n**How it works (taught in Week 07):**\nConvolutional Neural Networks (CNNs) are trained on millions of labelled scans. They identify pixel patterns that correlate with diagnoses — pneumonia, nodules, fractures, bleeds.\n\n**What you learn in Week 07:**\n• CNNs and transfer learning applied to medical images\n• Radiology AI: chest X-ray, CT, MRI interpretation\n• Pathology AI: histopathology slide analysis\n• Ophthalmology AI: diabetic retinopathy screening\n• Obstetric ultrasound AI: fetal biometry automation\n• Image interpretation lab: AI vs. expert radiologist\n\n**What AI cannot replace (also covered):**\n• Clinical context and patient history\n• Final medicolegal responsibility\n• Rare presentations outside training distribution\n\n**Week 07** builds on Weeks 01–03 (ML foundations) — enrol in the Complete 10-Week Programme for the full journey.`,
      suggestions: ['Enrol in full programme', 'Clinical AI track Weeks 6-7', 'AI Ethics Week 4', 'Week 7 Medical Imaging']
    },
    {
      id: 'ai_diagnostics',
      keywords: ['ai diagnostic','clinical decision support','cdss','diagnosis ai','differential diagnosis ai','symptom checker','triage ai'],
      response: `**AI Diagnostics & Clinical Decision Support Systems (CDSS)** — covered in **Week 06** of the AMZ MedAI Zone curriculum:\n\n**Week 06 · Diagnostic Algorithms & CDSS — what you'll learn:**\n• How CDSS pattern recognition works\n• Types of CDSS and integration challenges in African health systems\n• Explainability: understanding and communicating AI output\n• Case study: evaluating a malaria diagnostic AI tool\n\n**Common CDSS functions discussed:**\n• Flag drug-drug interactions in prescriptions\n• Alert on abnormal lab results needing urgent action\n• Suggest differential diagnoses from symptom patterns\n• Risk-score sepsis, deterioration, and cardiac arrest\n\n**Critical skills (Week 06):**\n✓ How to critically appraise AI output (it's not always right)\n✓ When to override AI suggestions\n✓ Alert fatigue — recognising and managing it\n✓ Your medicolegal position when using CDSS tools\n\nWeek 06 is part of the **Clinical AI Track (Weeks 6–7)** or the Complete Programme.`,
      suggestions: ['Clinical AI track Weeks 6-7', 'Enrol in full programme', 'What is alert fatigue?', 'AI Ethics Week 4']
    },
    {
      id: 'certificates',
      keywords: ['certificate','certification','cpd','cme','accreditation','recognised','credit','qualification','credential','verified'],
      response: `**Certificates & CPD Accreditation:**\n\nAll AMZ MedAI Zone completion certificates are:\n\n✅ **CME/CPD accredited** — recognised by medical councils internationally\n✅ **Digitally verifiable** — shareable credentials for your LinkedIn and CV\n✅ **Programme-specific** — certificates name the weeks/track completed\n\n**Accrediting bodies aligned with:**\n• Kenya Medical Practitioners & Dentists Council (KMPDC)\n• American Medical Association (AMA)\n• General Medical Council UK (GMC)\n• Kenya Medical Association\n• WHO Health Workforce frameworks\n\n**CPD hours by track:**\n• Complete 10-Week Programme → ~80 CPD hours\n• AI Foundations (Weeks 1–3) → ~24 CPD hours\n• Ethics & Governance (Weeks 4–5) → ~16 CPD hours\n• Clinical AI (Weeks 6–7) → ~16 CPD hours\n• Public Health AI (Week 8) → ~8 CPD hours\n• AI Tools & NLP (Week 9) → ~8 CPD hours\n• Capstone & Future of AI (Week 10) → ~8 CPD hours`,
      suggestions: ['Enrol in full programme', 'Institutional packages', 'Contact us', 'Full curriculum overview']
    },
    {
      id: 'sandbox',
      keywords: ['sandbox','practice','simulation','real cases','hands on','hands-on','case study','clinical case','practise','try'],
      response: `**The AMZ AI Sandbox** 🧪\n\nThe Sandbox is our most popular feature — a safe, simulated clinical environment where you interact with real AI diagnostic tools on real anonymised patient cases.\n\n**What you can do in the Sandbox:**\n• Upload (anonymised) X-ray images and see AI analysis in real time\n• Compare your own clinical interpretation with the AI output\n• Access 10,000+ annotated cases with expert explanations\n• Practise on rare conditions you may rarely see in your hospital\n• Receive instant feedback on your diagnostic reasoning\n\n**Data safety:**\nAll sandbox cases are fully anonymised and de-identified, sourced with ethics board approval. No real patient data is ever accessible to learners.\n\nThe Sandbox is available from the **Intermediate level** onwards in all learning paths.`,
      suggestions: ['Enroll to access Sandbox', 'AI Ethics — patient data', 'Radiology AI cases', 'Beginner courses first']
    },
    {
      id: 'ai_ethics',
      keywords: ['ethics','bias','fair','responsibility','accountability','consent','transparent','explainable','black box','regulation','liability','legal'],
      response: `**AI Ethics in Healthcare** — covered across two dedicated weeks in the AMZ MedAI curriculum:\n\n⚖️ **Week 04 · AI Ethics — Decolonised & African Perspectives**\n• Critique of WHO, EU AI Act, OECD frameworks from an African lens\n• **Ubuntu philosophy** — communal values in AI decision-making\n• **The CARE framework** — Community, Accountability, Respect, Empowerment\n• Ethical dilemma debates using real African healthcare scenarios\n\n🔒 **Week 05 · Data Handling, Privacy & Governance**\n• **Kenya Data Protection Act 2019** applied to clinical AI tools\n• Privacy-preserving techniques: federated learning, differential privacy\n• Data governance models and community-based consent\n• Patient rights over health data used to train AI\n\n**Key questions both weeks address:**\n• When must you disclose that AI is involved in a clinical decision?\n• Who is legally responsible when AI is wrong?\n• How do you handle algorithmic bias in your patient population?\n\nEthics & Data Governance (Weeks 4–5) is available as a standalone track or as part of the Complete Programme.`,
      suggestions: ['Ethics & Governance track Weeks 4-5', 'What is the CARE framework?', 'Kenya Data Protection Act', 'Enrol in full programme']
    },
    {
      id: 'time_commitment',
      keywords: ['how long','time','duration','hours','weeks','schedule','busy','part time','self paced','flexible'],
      response: `**Time commitment — designed for busy clinicians:**\n\nThe programme is **10 weeks · ~80 hours total** — but you learn at your own pace.\n\n**Track-by-track breakdown:**\n• 🌱 Foundations (Weeks 1–3) — ~24 hrs\n• ⚖️ Ethics & Governance (Weeks 4–5) — ~16 hrs\n• 🩺 Clinical AI (Weeks 6–7) — ~16 hrs\n• 🌍 Public Health AI (Week 8) — ~8 hrs\n• 🤖 AI Tools & NLP (Week 9) — ~8 hrs\n• 🏆 Capstone & Future of AI (Week 10) — ~8 hrs\n\n**In practice:**\n• 1 week's content ≈ 8 hours ≈ 4 x 2-hour evening sessions\n• Most working clinicians complete the full programme in 10–16 weeks\n• No live sessions, no deadlines — progress is saved automatically\n\n**Mobile-first:** Every module works on a smartphone and can be downloaded for offline use — perfect for low-bandwidth hospital environments.`,
      suggestions: ['Enrol in full programme', 'Foundations track Weeks 1-3', 'View the full curriculum', 'Institutional packages']
    },
    {
      id: 'pricing',
      keywords: ['price','cost','pricing','fee','free','paid','subscription','plan','money','afford','cheap','expensive'],
      response: `**AMZ MedAI Zone Enrolment:**\n\nWe offer individual and institutional enrolment packages tailored to your needs.\n\n💙 **Individual Enrolment**\n   • Full access to all courses\n   • AI Sandbox (annotated clinical cases)\n   • CPD certificates (KMPDC · AMA · GMC)\n   • Offline downloads\n   • Expert Q&A sessions\n   • Research hub access\n\n⭐ **Institutional Package**\n   • Unlimited staff access\n   • Manager dashboard for CPD compliance tracking\n   • Custom learning paths for your organisation\n   • Bulk CPD reporting\n   • Dedicated account manager\n\nFor enrolment details and pricing, please contact us at +254 756 535 289 or info@amzmedzone.co.ke`,
      suggestions: ['Enroll now', 'Institutional packages', 'What CPD hours do I earn?', 'Contact us']
    },
    {
      id: 'institution',
      keywords: ['hospital','institution','team','organisation','department','bulk','enterprise','whole team','staff','group'],
      response: `**Institutional & Hospital Licenses:**\n\nIdeal for hospitals, medical schools, health systems, and NGOs wanting to train their entire clinical staff.\n\n**What's included:**\n✅ Unlimited seat licenses for your staff\n✅ Custom learning paths aligned with your protocols\n✅ Manager dashboard — track progress across departments\n✅ Bulk CPD reporting for regulatory submissions\n✅ White-label option (your branding on the platform)\n✅ Dedicated account manager and clinical educator support\n✅ Quarterly new course additions at no extra cost\n\nContact **info@amzmedzone.co.ke** or +254 756 535 289 to get a custom institutional quote tailored to your organisation.`,
      suggestions: ['Get institutional quote', 'How many staff can enroll?', 'CPD reporting for hospitals', 'Contact our team']
    },
    {
      id: 'thank_you',
      keywords: ['thank','thanks','thank you','appreciate','helpful','great','awesome','amazing','perfect','brilliant','good'],
      response: `You're very welcome! 😊 Happy to help.\n\nRemember — learning how to work alongside AI is one of the most valuable skills a modern clinician can develop. You're already ahead by being here.\n\nIs there anything else I can help you with? Or are you ready to **enroll and start your first module today?**`,
      suggestions: ['Enroll now', 'Browse courses', 'View learning paths', 'Ask another question']
    },
    {
      id: 'goodbye',
      keywords: ['bye','goodbye','see you','farewell','exit','quit','later','take care','done'],
      response: `Take care, and see you in the classroom! 🌿\n\nYour patients will benefit from every skill you learn. AMZ MedAI Zone is here whenever you're ready to grow.\n\n**Bridging Tech & Human Life — every day.** 💙`,
      suggestions: ['Enrol now', 'Browse courses']
    }
  ];

  function findBestResponse(input) {
    const tokens = input.toLowerCase().split(/\s+/);
    let bestScore = 0, bestEntry = null;

    KB.forEach(entry => {
      let score = 0;
      entry.keywords.forEach(kw => {
        if (input.toLowerCase().includes(kw)) score += kw.split(' ').length * 2;
        tokens.forEach(tok => { if (kw.includes(tok) && tok.length > 3) score += 0.5; });
      });
      if (score > bestScore) { bestScore = score; bestEntry = entry; }
    });

    if (bestScore > 0) return bestEntry;

    return {
      response: `Great question! I'm focused on AMZ MedAI Zone's courses and AI-in-healthcare topics.\n\nFor that specific question, I'd recommend:\n• **Browsing our course catalog** — we likely have a module covering it\n• **Posting in our community forum** — 12,000+ clinicians who may have encountered the same thing\n• **Emailing our team** at learn@amzmedzone.com\n\nIs there anything about our **courses, learning paths, certificates, or AI in healthcare** I can help with?`,
      suggestions: ['View learning paths', 'Browse courses', 'Pricing information', 'Talk to our team']
    };
  }

  /* ── DOM ── */
  const container     = document.getElementById('chatbotContainer');
  const toggleBtn     = document.getElementById('chatbotToggle');
  const closeBtn      = document.getElementById('chatClose');
  const minimizeBtn   = document.getElementById('chatMinimize');
  const clearBtn      = document.getElementById('chatClear');
  const messagesDiv   = document.getElementById('chatMessages');
  const inputEl       = document.getElementById('chatInput');
  const sendBtn       = document.getElementById('chatSend');
  const suggestionsEl = document.getElementById('chatSuggestions');
  const badge         = document.querySelector('.chat-notification-badge');
  const iconOpen      = toggleBtn?.querySelector('.toggle-icon-open');
  const iconClose     = toggleBtn?.querySelector('.toggle-icon-close');

  let isOpen = false, isMinimized = false, history = [];

  function addMessage(text, sender = 'bot') {
    const div    = document.createElement('div');
    div.className = `chat-message ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = `msg-avatar ${sender === 'bot' ? 'bot' : 'user-av'}`;
    avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-user-md"></i>' : '<i class="fas fa-user"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

    div.appendChild(avatar);
    div.appendChild(bubble);
    messagesDiv.appendChild(div);
    history.push({ sender, text });
    scrollToBottom();
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'chat-message bot typing-msg';
    el.innerHTML = `
      <div class="msg-avatar bot"><i class="fas fa-user-md"></i></div>
      <div class="msg-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>`;
    messagesDiv.appendChild(el);
    scrollToBottom();
    return el;
  }

  function renderSuggestions(list) {
    suggestionsEl.innerHTML = '';
    if (!list || !list.length) return;
    list.forEach(text => {
      const btn = document.createElement('button');
      btn.className  = 'suggestion-btn';
      btn.textContent = text;
      btn.addEventListener('click', () => sendMessage(text));
      suggestionsEl.appendChild(btn);
    });
  }

  function scrollToBottom() { messagesDiv.scrollTop = messagesDiv.scrollHeight; }

  function sendMessage(text) {
    const msg = (text || inputEl.value).trim();
    if (!msg) return;
    inputEl.value = ''; inputEl.style.height = 'auto';
    suggestionsEl.innerHTML = '';
    addMessage(msg, 'user');

    const typing = showTyping();
    const delay  = 800 + Math.random() * 700;

    setTimeout(() => {
      typing.remove();
      const entry = findBestResponse(msg);
      addMessage(entry.response, 'bot');
      if (entry.suggestions) renderSuggestions(entry.suggestions);
    }, delay);
  }

  function openChat() {
    isOpen = true;
    container.classList.add('open');
    container.removeAttribute('aria-hidden');
    toggleBtn.setAttribute('aria-label', 'Close AI Mentor');
    if (iconOpen)  iconOpen.style.display  = 'none';
    if (iconClose) iconClose.style.display = 'block';
    if (badge) badge.classList.add('hidden');
    inputEl.focus();

    if (!history.length) {
      const entry = KB.find(k => k.id === 'greeting');
      setTimeout(() => { addMessage(entry.response, 'bot'); renderSuggestions(entry.suggestions); }, 400);
    }
  }

  function closeChat() {
    isOpen = false;
    container.classList.remove('open');
    container.setAttribute('aria-hidden', 'true');
    toggleBtn.setAttribute('aria-label', 'Open AMZ AI Mentor');
    if (iconOpen)  iconOpen.style.display  = 'block';
    if (iconClose) iconClose.style.display = 'none';
  }

  toggleBtn?.addEventListener('click', () => isOpen ? closeChat() : openChat());
  closeBtn?.addEventListener('click', closeChat);

  minimizeBtn?.addEventListener('click', () => {
    isMinimized = !isMinimized;
    container.classList.toggle('minimized', isMinimized);
    minimizeBtn.title = isMinimized ? 'Expand' : 'Minimize';
    minimizeBtn.querySelector('i').className = isMinimized ? 'fas fa-expand-alt' : 'fas fa-minus';
  });

  clearBtn?.addEventListener('click', () => {
    messagesDiv.innerHTML = ''; suggestionsEl.innerHTML = ''; history = [];
    const entry = KB.find(k => k.id === 'greeting');
    setTimeout(() => { addMessage(entry.response, 'bot'); renderSuggestions(entry.suggestions); }, 200);
  });

  sendBtn?.addEventListener('click', () => sendMessage());

  inputEl?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  inputEl?.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  window.openChatbot = openChat;

  setTimeout(() => { if (!isOpen && badge) badge.classList.remove('hidden'); }, 5000);

})();


/* ── SMOOTH SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
