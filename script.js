/* ═══════════════════════════════════════════════════════════════
   AMZ MedAI Academy | Main Script
   AI Education for Healthcare Professionals
═══════════════════════════════════════════════════════════════ */

'use strict';

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

  const cards = track.querySelectorAll('.testimonial-card');
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
    const btn = item.querySelector('.faq-question');
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

  form.addEventListener('submit', e => {
    e.preventDefault();
    const v1 = validate('firstName', 'firstNameError', v => v.length >= 2, 'Please enter your first name.');
    const v2 = validate('lastName',  'lastNameError',  v => v.length >= 2, 'Please enter your last name.');
    const v3 = validate('email',     'emailError',     v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Please enter a valid email.');
    const v4 = validate('service',   'serviceError',   v => v !== '',       'Please select your role.');

    if (v1 && v2 && v3 && v4) {
      const btn  = form.querySelector('.btn-primary');
      const orig = btn.querySelector('.btn-text').textContent;
      btn.disabled = true;
      btn.querySelector('.btn-text').textContent = 'Creating account…';

      setTimeout(() => {
        btn.disabled = false;
        btn.querySelector('.btn-text').textContent = orig;
        form.reset();
        showToast('Welcome! Check your email to complete registration.');
      }, 1800);
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
      form.reset();
      showToast('Subscribed! Welcome to the AMZ MedAI Academy community.');
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
      response: `Hello! I'm your **AMZ AI Mentor** 👋 — here to help you navigate our courses, understand AI in healthcare, and find the right learning path for your role.\n\nWhat would you like to explore today?`,
      suggestions: ['What courses are available?', 'Which path is right for me?', 'How does AI help doctors?', 'Tell me about the AI sandbox']
    },
    {
      id: 'getting_started',
      keywords: ['how to start','get started','sign up','register','create account','join','onboard','begin','new here','where do i start'],
      response: `**Getting started is simple and free:**\n\n**Step 1 →** Fill in the enrollment form on this page (scroll down)\n\n**Step 2 →** Verify your healthcare credentials — this unlocks all accredited content\n\n**Step 3 →** Take our **5-minute specialty assessment** — our AI recommends the perfect learning path for your role\n\n**Step 4 →** Start your first module immediately — most beginners complete their first lesson in under 30 minutes\n\nNo technical background needed. No credit card. Just your curiosity.`,
      suggestions: ['What learning paths are available?', 'Do I need to know coding?', 'How long do courses take?', 'Will I get a certificate?']
    },
    {
      id: 'no_coding',
      keywords: ['coding','programming','python','math','technical','data science','engineer','no background','non-technical','do i need'],
      response: `**You do not need any coding or maths background.** 🙌\n\nOur courses are built for clinicians — we explain everything in clinical language you already understand.\n\n• "Training data" → like a junior doctor learning from thousands of cases\n• "Algorithm" → like a diagnostic protocol\n• "Neural network" → like the pattern recognition your brain already does\n\nIf you can interpret a lab report or read a clinical guideline, you can complete our courses. We handle the maths — you focus on applying AI to patient care.\n\nThe **beginner paths** (AI Ethics, Reading AI Dashboards) require zero technical knowledge at all.`,
      suggestions: ['Which course should I start with?', 'What is machine learning?', 'AI Diagnostics course', 'Beginner learning paths']
    },
    {
      id: 'learning_paths',
      keywords: ['learning path','course path','program','curriculum','track','specialty','which course','what to study','pathway'],
      response: `**AMZ MedAI Academy offers 6 structured learning paths:**\n\n🧠 **AI Diagnostics for Clinicians** *(Most popular)* — 24 modules, 40 hrs\n📡 **Radiology AI Mastery** — 32 modules, 60 hrs\n📊 **Healthcare Data Analytics** — 20 modules, 35 hrs\n🤖 **Surgical Robotics & AI** — 18 modules, 30 hrs\n⚖️ **AI Ethics & Clinical Safety** — 12 modules, 20 hrs\n🧬 **Genomics & Precision Medicine AI** — 22 modules, 45 hrs\n\nNot sure which fits? Take our **5-minute specialty assessment** after registering — our AI will recommend the best starting point for your role and experience.`,
      suggestions: ['I am a radiologist', 'I am a nurse', 'I am a general practitioner', 'I am a medical student']
    },
    {
      id: 'for_radiologist',
      keywords: ['radiologist','radiology','imaging','x-ray','xray','ct scan','mri','ultrasound','scan','picture archiving'],
      response: `**For Radiologists — your recommended path:**\n\n🏆 **Radiology AI Mastery** (start here)\n   → 32 modules · 60 hours · Advanced\n   → Chest X-ray AI, CT analysis, MRI interpretation, ultrasound AI\n   → 10,000+ annotated real cases in the AI Sandbox\n\nAfter completing this path you'll be able to:\n• Critically evaluate AI output from radiological AI tools\n• Understand the strengths and failure modes of image AI\n• Write departmental protocols for AI-assisted reporting\n• Earn 60 CPD hours recognised internationally\n\n**Also recommended:** AI Ethics & Clinical Safety (pairs well with any imaging path)`,
      suggestions: ['AI Sandbox explained', 'CPD certificate details', 'Enroll in Radiology AI', 'AI Ethics course']
    },
    {
      id: 'for_nurse',
      keywords: ['nurse','nursing','ward','midwife','clinical nurse','sister','matron','healthcare worker','allied health'],
      response: `**For Nurses & Allied Health Professionals:**\n\n✅ **Recommended starting point:**\n📊 *Reading AI Health Dashboards* — 4h 45m, Beginner, free\n   → Interpret real-time AI monitoring data on the ward\n   → Understand AI alerts and when to escalate\n\n🌟 **Then progress to:**\n⚖️ *AI Ethics & Clinical Safety* — 5h, Beginner\n   → Understand your responsibilities when using AI tools\n\n💡 **Advanced option:**\n🧠 *AI Diagnostics for Clinicians* — for clinical nurses looking to deepen their knowledge\n\nAll courses are mobile-first and work offline — perfect for busy ward schedules.`,
      suggestions: ['Mobile learning', 'AI Dashboards course', 'AI Ethics course', 'CPD hours for nurses']
    },
    {
      id: 'for_gp',
      keywords: ['general practitioner','gp','family doctor','primary care','community health','general medicine','internist'],
      response: `**For General Practitioners:**\n\n🎯 **Your recommended starting path:**\n🧠 *AI Diagnostics for Clinicians* — the most practical course for GPs\n   → AI-assisted triage and referral decision support\n   → Interpreting AI outputs from telehealth systems\n   → Remote monitoring tools and wearable data\n\n**Quick wins (complete in 1 weekend):**\n• *Reading AI Health Dashboards* — 4h 45m\n• *AI Ethics & Clinical Safety* — 5h (includes consent guidance for AI tools)\n\nGPs see the broadest range of AI tools (diagnostic apps, telehealth AI, wearable alerts) — our courses cover all of them.`,
      suggestions: ['AI in primary care', 'Telehealth AI tools', 'Enroll in AI Diagnostics', 'Time commitment?']
    },
    {
      id: 'for_student',
      keywords: ['student','intern','junior doctor','medical student','house officer','foundation','residency','trainee'],
      response: `**For Medical Students & Junior Doctors:**\n\nYou're entering medicine at the perfect time — AI will be part of your entire career. Here's your recommended start:\n\n🆓 **Start free:**\n⚖️ *AI Ethics & Clinical Safety* — understand AI before you use it\n📊 *Reading AI Health Dashboards* — practical skill you'll use from Day 1\n\n🚀 **Then build expertise in your specialty:**\nOnce you know your specialty direction, enrol in the matching path (Radiology, Cardiology, Neuro, etc.)\n\n💡 **Pro tip:** Most medical schools now expect graduates to understand basic AI principles. Our certificates look great on a portfolio and CV.`,
      suggestions: ['Free courses for students', 'AI in medical school', 'Build my CV with AI skills', 'Enroll now']
    },
    {
      id: 'ai_radiology',
      keywords: ['ai radiology','chest xray ai','ct ai','mri ai','radiology ai','image recognition','cnn','convolutional','deep learning radiology'],
      response: `**AI in Radiology** is one of the most advanced and clinically proven applications of AI in medicine. Here's what you need to know:\n\n**How it works:**\nConvolutional Neural Networks (CNNs) are trained on millions of labelled scans. They identify pixel patterns that correlate with diagnoses — pneumonia, nodules, fractures, bleeds.\n\n**What AI can do now:**\n• Detect pneumonia on chest X-ray with 94% sensitivity\n• Identify pulmonary nodules ≥3mm in CT\n• Triage non-contrast CT for intracranial haemorrhage in under 5 seconds\n• Detect diabetic retinopathy in fundus photos\n\n**What AI cannot replace:**\n• Clinical context and patient history\n• Complex multi-lesion cases\n• Rare presentations outside training distribution\n• Final responsibility — that remains with the radiologist\n\n**Our Radiology AI Mastery path** covers all of this with 10,000+ annotated cases.`,
      suggestions: ['Enroll in Radiology AI', 'AI Sandbox explained', 'AI limitations in radiology', 'CPD certificate details']
    },
    {
      id: 'ai_diagnostics',
      keywords: ['ai diagnostic','clinical decision support','cdss','diagnosis ai','differential diagnosis ai','symptom checker','triage ai'],
      response: `**AI Diagnostics & Clinical Decision Support Systems (CDSS)**\n\nAI-powered CDSS tools are already deployed in hospitals across Africa and worldwide. Here's how clinicians use them:\n\n**Common CDSS functions:**\n• Flag potential drug-drug interactions in prescriptions\n• Alert to abnormal lab results requiring urgent action\n• Suggest differential diagnoses based on symptom patterns\n• Risk-score sepsis, deterioration, and cardiac arrest\n• Recommend evidence-based treatment pathways\n\n**Key skills our course teaches:**\n✓ How to critically appraise AI output (it's not always right)\n✓ When to override AI suggestions\n✓ How to document AI-assisted decisions\n✓ Understanding alert fatigue and how to manage it\n✓ Your medicolegal position when using AI tools\n\nEnroll in **AI Diagnostics for Clinicians** to master these skills.`,
      suggestions: ['Enroll in AI Diagnostics', 'What is alert fatigue?', 'AI Ethics course', 'AI in emergency medicine']
    },
    {
      id: 'certificates',
      keywords: ['certificate','certification','cpd','cme','accreditation','recognised','credit','qualification','credential','verified'],
      response: `**Certificates & CPD Accreditation:**\n\nAll AMZ MedAI Academy completion certificates are:\n\n✅ **CME/CPD accredited** — points recognised by medical councils in 48 countries\n✅ **Digitally verifiable** — blockchain-verified credentials shareable on LinkedIn\n✅ **Role-specific** — certificates state your specialty and the clinical skills earned\n\n**Accrediting bodies include:**\n• Kenya Medical Association\n• Nigerian Medical Association\n• Health Professions Council of South Africa (HPCSA)\n• American Medical Association (AMA)\n• Royal College of Physicians (UK)\n• And 43 more national bodies\n\n**CPD hours per path:**\n• AI Diagnostics for Clinicians → 40 CPD hours\n• Radiology AI Mastery → 60 CPD hours\n• Healthcare Data Analytics → 35 CPD hours\n• AI Ethics & Clinical Safety → 20 CPD hours`,
      suggestions: ['How to share my certificate', 'Enroll now', 'Institutional licenses', 'Which path earns most CPD?']
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
      response: `**AI Ethics in Healthcare** is one of the most important topics for any clinician using AI tools. Our dedicated course covers:\n\n**Key topics:**\n• **Algorithmic bias** — AI trained on non-diverse data may underperform for your patient population\n• **Explainability** — "black box" AI and how to communicate uncertainty to patients\n• **Informed consent** — when must you disclose that AI is involved in a clinical decision?\n• **Medicolegal liability** — who is responsible when AI is wrong?\n• **Regulatory landscape** — FDA, CE marking, and African regulatory frameworks for AI medical devices\n• **Data sovereignty** — patient rights over health data used to train AI\n\n**Our course verdict:**\n*AI Ethics & Clinical Safety* (5 hours, Beginner, free to preview) is recommended for **every** healthcare professional using or considering AI tools — regardless of specialty.`,
      suggestions: ['Enroll in AI Ethics', 'What is algorithmic bias?', 'Patient consent and AI', 'AI regulation in Africa']
    },
    {
      id: 'time_commitment',
      keywords: ['how long','time','duration','hours','weeks','schedule','busy','part time','self paced','flexible'],
      response: `**Time commitment — designed for busy clinicians:**\n\nAll courses are fully **self-paced** — you learn on your schedule, not ours.\n\n**Typical course durations:**\n• Bite-sized intro courses: **4–6 hours** (completable in one weekend)\n• Full learning paths: **20–60 hours** (most learners finish in 4–8 weeks)\n\n**Learning in 20-minute blocks:**\nEvery module is designed to fit into the gaps in your clinical day:\n• One module between ward rounds\n• Two modules on a commute\n• A full path over a leave period\n\n**Mobile-first, offline-capable:**\nDownload modules and study without internet. Perfect for hospital environments with poor connectivity.\n\nThere are no deadlines, no cohorts, and no pressure. Your progress is saved automatically.`,
      suggestions: ['Get started free', 'Mobile app details', 'Course catalog', 'Institutional plans']
    },
    {
      id: 'pricing',
      keywords: ['price','cost','pricing','fee','free','paid','subscription','plan','money','afford','cheap','expensive'],
      response: `**AMZ MedAI Academy Pricing:**\n\n🆓 **Free Forever**\n   • Preview all courses (first 2 modules)\n   • AI Mentor chatbot access\n   • Community forums\n   • Basic AI literacy resources\n\n💙 **Individual — from $29/month**\n   • Full access to all 120+ courses\n   • AI Sandbox (all cases)\n   • CPD certificates\n   • Offline downloads\n   • Expert Q&A sessions\n\n⭐ **Institution — Custom pricing**\n   • Unlimited staff access\n   • Progress dashboards for managers\n   • Custom learning paths for your hospital\n   • Bulk CPD reporting\n   • Dedicated account manager\n\nMany institutions cover subscription costs as part of CPD budgets. Contact us to verify.`,
      suggestions: ['Create free account', 'Institutional licenses', 'What CPD hours do I earn?', 'Enroll now']
    },
    {
      id: 'institution',
      keywords: ['hospital','institution','team','organisation','department','bulk','enterprise','whole team','staff','group'],
      response: `**Institutional & Hospital Licenses:**\n\nIdeal for hospitals, medical schools, health systems, and NGOs wanting to train their entire clinical staff.\n\n**What's included:**\n✅ Unlimited seat licenses for your staff\n✅ Custom learning paths aligned with your protocols\n✅ Manager dashboard — track progress across departments\n✅ Bulk CPD reporting for regulatory submissions\n✅ White-label option (your branding on the platform)\n✅ Dedicated account manager and clinical educator support\n✅ Quarterly new course additions at no extra cost\n\n**Current institutional partners include:**\nKenyatta National Hospital · Lagos University Teaching Hospital · Groote Schuur Hospital · Aga Khan University\n\nContact **learn@amzmedzone.com** or use the enrollment form to get a custom quote.`,
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
      response: `Take care, and see you in the classroom! 🌿\n\nYour patients will benefit from every skill you learn. AMZ MedAI Academy is here whenever you're ready to grow.\n\n**Bridging Tech & Human Life — every day.** 💙`,
      suggestions: ['Create free account', 'Browse courses']
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
      response: `Great question! I'm focused on AMZ MedAI Academy's courses and AI-in-healthcare topics.\n\nFor that specific question, I'd recommend:\n• **Browsing our course catalog** — we likely have a module covering it\n• **Posting in our community forum** — 12,000+ clinicians who may have encountered the same thing\n• **Emailing our team** at learn@amzmedzone.com\n\nIs there anything about our **courses, learning paths, certificates, or AI in healthcare** I can help with?`,
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
