/* ═══════════════════════════════════════════════════════════════
   AMZ MedAI Academy | Main Script
   AI Education for Healthcare Professionals
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── RESILIENT /api/me CHECK — retries before treating the visitor as signed out,
   so a single dropped request (flaky network, an over-eager browser extension)
   doesn't bounce a genuinely signed-in doctor back to the login page. ── */
window.fetchMe = async function fetchMe(retries = 2, delayMs = 500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (res.ok) return await res.json();
    } catch (err) { /* network blip — fall through to retry */ }
    if (attempt < retries) await new Promise(r => setTimeout(r, delayMs));
  }
  return null;
};

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


/* ── NAV AUTH STATE — show who's signed in instead of Sign In/Get Started ── */
(async function initAuthNav() {
  let user;
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) return;
    user = await res.json();
  } catch (err) {
    return;
  }

  async function logOut(e) {
    e.preventDefault();
    await fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    window.location.href = 'index.html';
  }

  document.querySelectorAll('.signin-btn').forEach(el => {
    el.innerHTML = `<i class="fas fa-user"></i> Hi, ${user.firstName}`;
    el.href = user.isAdmin ? 'admin.html' : 'dashboard.html';
  });
  document.querySelectorAll('.nav-actions .btn-cta-nav').forEach(el => {
    el.innerHTML = `<i class="fas fa-sign-out-alt"></i> Log Out`;
    el.href = '#';
    el.addEventListener('click', logOut);
  });
  document.querySelectorAll('.nav-link-mobile-action').forEach(el => {
    if (el.classList.contains('cta')) {
      el.textContent = 'Log Out';
      el.href = '#';
      el.addEventListener('click', logOut);
    } else {
      el.textContent = `Hi, ${user.firstName}`;
      el.href = user.isAdmin ? 'admin.html' : 'dashboard.html';
    }
  });

  const dashboardUrl = user.isAdmin ? 'admin.html' : 'dashboard.html';

  // Hero "Get Started" CTA on the homepage — once signed in, it should lead
  // back into the platform rather than re-show the signup form.
  const heroCta = document.getElementById('heroAuthCta');
  if (heroCta) {
    heroCta.href = dashboardUrl;
    const label = heroCta.querySelector('span');
    if (label) label.textContent = 'Continue Learning';
    const icon = heroCta.querySelector('i');
    if (icon) icon.className = 'fas fa-arrow-right';
  }

  // Footer "Sign In" / "Create Account" links — same idea, repointed to the dashboard and log out.
  const footerSignIn = document.getElementById('footerSignInLink');
  if (footerSignIn) {
    footerSignIn.textContent = 'My Dashboard';
    footerSignIn.href = dashboardUrl;
  }
  const footerSignup = document.getElementById('footerSignupLink');
  if (footerSignup) {
    footerSignup.textContent = 'Log Out';
    footerSignup.href = '#';
    footerSignup.addEventListener('click', logOut);
  }
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


/* ── NEWSLETTER FORM ── */
(function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    } catch (err) { /* fail silently — non-critical */ }
    form.reset();
    showToast('Subscribed! Welcome to the AMZ MedAI Academy community.');
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
      response: `Hello! I'm your **AMZ AI Mentor** 👋 — here to guide you through our 10-week AI in Healthcare curriculum and help you get started.\n\nWhat would you like to explore today?`,
      suggestions: ['What does the 10-week curriculum cover?', 'Do I need a technical background?', 'Do I get a certificate?', 'How do I get started?']
    },
    {
      id: 'curriculum',
      keywords: ['curriculum','10 week','10-week','syllabus','what do you teach','course outline','modules','week by week','what is covered','programme content','schedule','topics covered','full programme','all weeks'],
      response: `**AMZ MedAI Academy — 10-Week Curriculum Overview:**\n\n**Week 01 · Introduction to AI in Healthcare & African Contexts**\n→ Define AI, ML, and deep learning\n→ African healthcare landscape and challenges\n\n**Week 02 · Fundamentals of Data Science & Statistics for Healthcare**\n→ Healthcare data types, sensitivity, specificity, AUC-ROC\n\n**Week 03 · Machine Learning Basics**\n→ Supervised & unsupervised learning, the ML workflow\n\n**Week 04 · AI Ethics — Global, Decolonised & African Perspectives**\n→ Ubuntu philosophy and the CARE framework\n\n**Week 05 · Data Handling, Privacy & Governance in African Healthcare**\n→ Kenya Data Protection Act 2019 applied\n\n**Week 06 · Diagnostic Algorithms & Clinical Decision Support Systems**\n→ Pattern recognition, explainability, CDSS case study\n\n**Week 07 · Medical Imaging & AI**\n→ Radiology, pathology, ophthalmology, obstetric ultrasound\n\n**Week 08 · Public Health Applications & Surveillance**\n→ Outbreak prediction, maternal & child health\n\n**Week 09 · Practical AI Tools, NLP & Large Language Models in Healthcare**\n→ Clinical documentation, ICD coding, multilingual NLP\n\n**Week 10 · Ethics, Regulation, Future of AI & Capstone Presentations**\n→ Capstone project presentations\n\nSee the full [Courses page](courses.html) for details.`,
      suggestions: ['What is the capstone project?', 'Do I need a technical background?', 'How do I get started?']
    },
    {
      id: 'getting_started',
      keywords: ['how to start','get started','sign up','register','create account','join','onboard','begin','new here','where do i start'],
      response: `**Getting started is straightforward:**\n\n**Step 1 — Create your account →** Click "Get Started" and fill in your name, email, password, and medical role\n\n**Step 2 — Start learning →** Work through the 10-week curriculum at your own pace\n\n**Step 3 — Complete your capstone →** Present your capstone project in Week 10\n\nNo coding background needed — just a doctor's licence and curiosity.`,
      suggestions: ['Full 10-week curriculum', 'Do I need to know coding?', 'Do I get a certificate?']
    },
    {
      id: 'no_coding',
      keywords: ['coding','programming','python','math','technical','data science','engineer','no background','non-technical','do i need'],
      response: `**You do not need any coding or maths background.** 🙌\n\nOur courses are built for doctors, not data scientists — we explain everything in plain, clinical language.\n\n• "Algorithm" → like a diagnostic protocol\n• "Training data" → like a junior doctor learning from cases\n\nThe **Foundations track (Weeks 1–3)** assumes zero prior AI exposure.`,
      suggestions: ['Full 10-week curriculum', 'How do I get started?', 'Do I get a certificate?']
    },
    {
      id: 'for_gp',
      keywords: ['general practitioner','gp','family doctor','primary care','community health','general medicine','internist','specialist','consultant','surgeon'],
      response: `**For General Practitioners, Specialists & Consultants:**\n\nA few weeks that are especially relevant:\n\n🩺 **Week 06 · Diagnostic Algorithms & Clinical Decision Support Systems**\n📷 **Week 07 · Medical Imaging & AI**\n⚖️ **Week 04–05 · Ethics & Data Governance**\n\nThe full 10-week programme covers all of this and more.`,
      suggestions: ['Full 10-week curriculum', 'How do I get started?']
    },
    {
      id: 'for_student',
      keywords: ['student','intern','junior doctor','medical student','house officer','foundation','residency','trainee','resident'],
      response: `**For Residents & Junior Doctors:**\n\nYou're entering medicine at a time when AI will be part of your entire career. A good starting point:\n\n🌱 **Weeks 1–3 — Foundations:**\n• AI & ML concepts in African healthcare\n• Data science & statistics\n• ML basics\n\n⚖️ **Weeks 4–5 — Ethics & Governance**\n\nComplete all 10 weeks and finish with a capstone project.`,
      suggestions: ['Full 10-week curriculum', 'What is the capstone?', 'How do I get started?']
    },
    {
      id: 'diagnostic_imaging',
      keywords: ['diagnosis ai','symptom checker','triage ai','clinical reasoning','diagnostic algorithm','cdss','clinical decision support','medical imaging','radiology','x-ray','ct scan','mri','ultrasound'],
      response: `**Diagnostic Algorithms & Medical Imaging** are covered in **Weeks 06–07**:\n\n🩺 **Week 06 · Diagnostic Algorithms & CDSS**\n• Pattern recognition and explainability\n• Case study: evaluating a malaria diagnostic AI at KNH\n\n📷 **Week 07 · Medical Imaging & AI**\n• CNNs, transfer learning, image classification\n• Radiology, pathology, ophthalmology, obstetric ultrasound\n• Lab: AI vs. expert radiologist`,
      suggestions: ['Full 10-week curriculum', 'How do I get started?']
    },
    {
      id: 'certificates',
      keywords: ['certificate','certification','cpd','cme','accreditation','recognised','credit','qualification','credential','verified'],
      response: `**Certificates:**\n\nYou receive a certificate of completion for finishing the 10-week programme and your capstone project.\n\nAMZ MedAI Academy is a new platform — we'll share updates here as formal CPD/CME accreditation with medical councils is finalised. We won't claim recognition we don't yet have.`,
      suggestions: ['Full 10-week curriculum', 'How do I get started?', 'Contact us']
    },
    {
      id: 'ai_ethics',
      keywords: ['ethics','bias','fair','responsibility','accountability','consent','transparent','explainable','black box','regulation','liability','legal'],
      response: `**AI Ethics & Governance** — covered across two dedicated weeks:\n\n⚖️ **Week 04 · AI Ethics — Global, Decolonised & African Perspectives**\n• WHO, EU AI Act, OECD frameworks critiqued\n• Ubuntu philosophy and the CARE framework\n\n🔒 **Week 05 · Data Handling, Privacy & Governance**\n• Kenya Data Protection Act 2019 applied\n• Privacy-preserving techniques: federated learning`,
      suggestions: ['Full 10-week curriculum', 'How do I get started?']
    },
    {
      id: 'time_commitment',
      keywords: ['how long','time','duration','hours','weeks','schedule','busy','part time','self paced','flexible'],
      response: `**Time commitment:**\n\nThe programme is **10 weeks**, one module per week, at your own pace.\n\n• No live sessions, no fixed deadlines — progress is saved automatically\n• Works on mobile as well as desktop`,
      suggestions: ['Full 10-week curriculum', 'How do I get started?']
    },
    {
      id: 'pricing',
      keywords: ['price','cost','pricing','fee','free','paid','subscription','plan','money','afford','cheap','expensive'],
      response: `For enrolment details and pricing, please contact us directly at info@amzmedzone.co.ke or +254 756 535 289 — we'll talk you through it.`,
      suggestions: ['Contact us', 'How do I get started?', 'Full 10-week curriculum']
    },
    {
      id: 'institution',
      keywords: ['hospital','institution','team','organisation','department','bulk','enterprise','whole team','staff','group'],
      response: `If you'd like to enrol multiple doctors from your hospital or department, get in touch and we'll help coordinate it directly.\n\nContact **info@amzmedzone.co.ke** or **+254 756 535 289**.`,
      suggestions: ['Contact us', 'How do I get started?']
    },
    {
      id: 'thank_you',
      keywords: ['thank','thanks','thank you','appreciate','helpful','great','awesome','amazing','perfect','brilliant','good'],
      response: `You're very welcome! 😊 Happy to help.\n\nLearning how to work safely and effectively with AI is one of the most valuable skills a modern doctor can develop.\n\nIs there anything else I can help you with? Or are you ready to **get started today?**`,
      suggestions: ['How do I get started?', 'Full 10-week curriculum', 'Ask another question']
    },
    {
      id: 'goodbye',
      keywords: ['bye','goodbye','see you','farewell','exit','quit','later','take care','done'],
      response: `Take care! 🌿 AMZ MedAI Academy is here whenever you're ready.\n\n**Bridging Tech & Human Life — every day.** 💙`,
      suggestions: ['How do I get started?', 'Full 10-week curriculum']
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
      response: `I'm focused on AMZ MedAI Academy's curriculum and how to get started — I may not have a good answer for that specific question yet.\n\nYou can email our team directly at **info@amzmedzone.co.ke** or call **+254 756 535 289**.\n\nIs there anything about the **curriculum, certificates, or getting started** I can help with?`,
      suggestions: ['Full 10-week curriculum', 'How do I get started?', 'Contact us']
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
