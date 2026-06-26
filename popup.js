document.addEventListener('DOMContentLoaded', async () => {
  // ===== TOAST SYSTEM =====
  const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toastHtml = `
      <div class="toast align-items-center text-bg-${type === 'error' ? 'danger' : 'dark'} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = toastHtml.trim();
    const toastEl = wrapper.firstChild;
    container.appendChild(toastEl);
    
    setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 300);
    }, 3000);
    toastEl.querySelector('.btn-close').addEventListener('click', () => toastEl.remove());
  };

  // ===== AUTHENTICATION =====
  const overlay = document.getElementById('login-overlay');
  const appContainer = document.getElementById('app-container');
  const btnGoogle = document.getElementById('btn-login-google');
  const btnGuest = document.getElementById('btn-login-guest');

  const checkAuth = () => {
    const savedMode = localStorage.getItem('authMode');

    if (savedMode === 'LOCAL') {
      window.StorageUtils.setMode('LOCAL');
      document.getElementById('config-auth-status').textContent = 'Local (Offline)';
      overlay.style.display = 'none';
      appContainer.style.display = 'flex';
      initializeApp();
      return;
    }

    // Se estiver em modo CLOUD, tenta usar o onAuthStateChanged
    if (savedMode === 'CLOUD' && window.FirebaseApp) {
      window.FirebaseApp.auth.onAuthStateChanged(user => {
        if (user) {
          window.StorageUtils.setMode('CLOUD');
          document.getElementById('config-auth-status').textContent = user.email;
          overlay.style.display = 'none';
          appContainer.style.display = 'flex';
          initializeApp();
        } else {
          localStorage.removeItem('authMode');
          overlay.style.display = 'flex';
          appContainer.style.display = 'none';
        }
      });
      return;
    }

    // Nenhum login salvo
    overlay.style.display = 'flex';
    appContainer.style.display = 'none';
  };

  btnGoogle.addEventListener('click', async () => {
    if (!window.FirebaseApp) {
      showToast('Firebase não configurado.', 'error');
      return;
    }
    try {
      const result = await window.FirebaseApp.signInWithPopup(window.FirebaseApp.auth, window.FirebaseApp.provider);
      localStorage.setItem('authMode', 'CLOUD');
      window.StorageUtils.setMode('CLOUD');
      document.getElementById('config-auth-status').textContent = result.user.email;
      showToast('Login realizado com sucesso!');
      overlay.style.display = 'none';
      appContainer.style.display = 'flex';
      initializeApp();
    } catch (error) {
      console.error(error);
      showToast('Erro ao fazer login com Google.', 'error');
    }
  });

  btnGuest.addEventListener('click', () => {
    localStorage.setItem('authMode', 'LOCAL');
    window.StorageUtils.setMode('LOCAL');
    document.getElementById('config-auth-status').textContent = 'Local (Offline)';
    showToast('Modo offline ativado.');
    overlay.style.display = 'none';
    appContainer.style.display = 'flex';
    initializeApp();
  });

  // Botão de Logout (na tela de config)
  document.getElementById('btn-logout').addEventListener('click', async () => {
    if (window.StorageUtils.getMode() === 'CLOUD' && window.FirebaseApp) {
      await window.FirebaseApp.auth.signOut();
    }
    localStorage.removeItem('authMode');
    location.reload();
  });

  checkAuth();

  // ===== APP INITIALIZATION =====
  let currentRules = [];
  let config = {};

  const initializeApp = async () => {
    currentRules = await window.StorageUtils.loadRules();
    if (!currentRules) {
      currentRules = JSON.parse(JSON.stringify(window.Engine.defaultQuestions));
    }
    window.Engine.questions = currentRules;

    config = await window.StorageUtils.loadConfig();
    updateConfigUI();
    loadProjectsList();
  };

  // ===== NAVIGATION =====
  const views = ['wizard', 'resultado', 'timer', 'projects', 'rules', 'config'];
  const switchView = (viewId) => {
    views.forEach(v => {
      document.getElementById(`view-${v}`).classList.remove('active');
      document.getElementById(`nav-${v}`)?.classList.remove('active');
    });
    document.getElementById(`view-${viewId}`).classList.add('active');
    document.getElementById(`nav-${viewId}`)?.classList.add('active');
  };

  ['wizard', 'timer', 'projects', 'rules', 'config'].forEach(v => {
    document.getElementById(`nav-${v}`).addEventListener('click', () => {
      if (v === 'projects') loadProjectsList();
      if (v === 'config') updateConfigUI();
      if (v === 'rules') loadRulesUI();
      switchView(v);
    });
  });

  // ===== FORMATTING =====
  const formatCurrency = (val) => `${config.currency || 'R$'} ${val.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // ===== CONFIG & EXPENSES =====
  const renderExpenses = () => {
    const container = document.getElementById('expenses-container');
    container.innerHTML = '';
    config.expenses.forEach((exp, idx) => {
      const item = document.createElement('div');
      item.className = 'd-flex gap-2 align-items-center';
      item.innerHTML = `
        <input type="text" class="form-control bg-black border-secondary text-white exp-name" data-idx="${idx}" value="${exp.name}" placeholder="Nome (ex: Luz)" style="flex:2;" />
        <input type="number" class="form-control bg-black border-secondary text-white exp-value" data-idx="${idx}" value="${exp.value}" placeholder="0,00" style="flex:1;" />
        <button class="btn btn-remove" data-idx="${idx}" title="Remover"><i class="bi bi-x-lg pointer-events-none"></i></button>
      `;
      container.appendChild(item);
    });

    container.querySelectorAll('.exp-name').forEach(el => {
      el.addEventListener('input', (e) => { config.expenses[e.target.dataset.idx].name = e.target.value; });
    });
    container.querySelectorAll('.exp-value').forEach(el => {
      el.addEventListener('input', (e) => { config.expenses[e.target.dataset.idx].value = parseFloat(e.target.value) || 0; });
    });
    container.querySelectorAll('.btn-remove').forEach(el => {
      el.addEventListener('click', (e) => {
        const idx = e.target.closest('button').dataset.idx;
        config.expenses.splice(idx, 1);
        renderExpenses();
      });
    });
  };

  document.getElementById('btn-add-expense').addEventListener('click', () => {
    config.expenses.push({ id: Date.now().toString(), name: 'Novo Custo', value: 0 });
    renderExpenses();
  });

  const updateConfigUI = () => {
    document.getElementById('config-name').value = config.name || '';
    document.getElementById('config-currency').value = config.currency || 'R$';
    document.getElementById('config-rate').value = config.hourlyRate || 50;
    document.getElementById('config-hours-month').value = config.hoursPerMonth || 160;
    document.getElementById('config-profit').value = config.profitMargin || 30;
    renderExpenses();
    updateRateDisplay();
  };

  const updateRateDisplay = () => {
    const rate = parseFloat(document.getElementById('config-rate').value) || 0;
    document.getElementById('calculated-rate-display').textContent =
      `${config.currency || 'R$'} ${rate.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}/h`;
  };

  document.getElementById('btn-calc-rate').addEventListener('click', () => {
    const hours = parseFloat(document.getElementById('config-hours-month').value) || 160;
    const profitMargin = parseFloat(document.getElementById('config-profit').value) || 30;
    let totalExpenses = 0;
    config.expenses.forEach(e => totalExpenses += e.value);

    if (totalExpenses === 0) {
      showToast('Preencha pelo menos um custo para calcular!', 'error');
      return;
    }

    const costRate = totalExpenses / hours;
    const finalRate = costRate * (1 + profitMargin / 100);

    document.getElementById('config-rate').value = finalRate.toFixed(2);
    updateRateDisplay();
    showToast(`Calculado: Custo ${costRate.toFixed(2)}/h + ${profitMargin}% Lucro`);
  });

  document.getElementById('btn-save-config').addEventListener('click', async () => {
    config.name = document.getElementById('config-name').value;
    config.currency = document.getElementById('config-currency').value;
    config.hourlyRate = parseFloat(document.getElementById('config-rate').value) || 50;
    config.hoursPerMonth = parseFloat(document.getElementById('config-hours-month').value) || 160;
    config.profitMargin = parseFloat(document.getElementById('config-profit').value) || 30;
    
    await window.StorageUtils.saveConfig(config);
    showToast('Configurações salvas!');
  });



  document.getElementById('config-rate').addEventListener('input', updateRateDisplay);

  // ===== RULE BUILDER =====
  const renderRuleOptions = (qIndex, options, container) => {
    container.innerHTML = '';
    options.forEach((opt, optIndex) => {
      const row = document.createElement('div');
      row.className = 'd-flex gap-2 align-items-center mb-2';
      row.innerHTML = `
        <input type="text" class="form-control bg-black border-secondary text-white opt-label form-control-sm" data-q="${qIndex}" data-o="${optIndex}" value="${opt.label}" placeholder="Texto da opção" style="flex:2;" title="Texto da resposta exibida">
        <input type="number" class="form-control bg-black border-secondary text-white opt-weight form-control-sm" data-q="${qIndex}" data-o="${optIndex}" value="${opt.weight}" step="1" placeholder="% (Ex: 20 ou -10)" style="flex:1;" title="Ajuste percentual no valor final (20 = +20%, -10 = desconto de 10%, 0 = sem alteração)">
        <input type="number" class="form-control bg-black border-secondary text-white opt-hours form-control-sm" data-q="${qIndex}" data-o="${optIndex}" value="${opt.hours}" placeholder="+Horas fixas" style="flex:1;" title="Adiciona horas físicas diretas no orçamento (ex: 10h)">
        <button class="btn btn-remove btn-sm btn-del-opt" data-q="${qIndex}" data-o="${optIndex}" title="Remover"><i class="bi bi-x-lg pointer-events-none"></i></button>
      `;
      container.appendChild(row);
    });
  };

  const loadRulesUI = () => {
    const rulesList = document.getElementById('rules-list');
    rulesList.innerHTML = '';
    currentRules.forEach((rule, qIndex) => {
      const item = document.createElement('div');
      item.className = 'accordion-item';
      const headerId = `heading-${qIndex}`;
      const collapseId = `collapse-${qIndex}`;
      item.innerHTML = `
        <h2 class="accordion-header d-flex" id="${headerId}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
            Pergunta ${qIndex + 1}: ${rule.text || 'Sem Título'}
          </button>
          <button class="btn btn-danger btn-sm m-2 btn-del-rule" data-q="${qIndex}"><i class="bi bi-trash pointer-events-none"></i></button>
        </h2>
        <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headerId}" data-bs-parent="#rules-list">
          <div class="accordion-body">
            <div class="mb-3">
              <label class="form-label text-secondary small">Texto da Pergunta</label>
              <input type="text" class="form-control bg-black border-secondary text-white rule-text" data-q="${qIndex}" value="${rule.text}">
            </div>
            <label class="form-label text-secondary small mb-1">Opções de Resposta</label>
            <div class="d-flex text-secondary mb-2 pe-4" style="font-size: 0.75rem; gap: 8px;">
              <span style="flex:2;">Respostas</span>
              <span style="flex:1;" title="Impacto % (0 = padrão). Ex: 20 aumenta 20%">Impacto % <i class="bi bi-info-circle"></i></span>
              <span style="flex:1;" title="Soma horas puras extras">Horas <i class="bi bi-info-circle"></i></span>
            </div>
            <div class="options-wrapper mb-3" id="opts-${qIndex}"></div>
            <button class="btn btn-sm btn-outline-secondary rounded-pill btn-add-opt" data-q="${qIndex}"><i class="bi bi-plus"></i> Adicionar Opção</button>
          </div>
        </div>
      `;
      rulesList.appendChild(item);
      renderRuleOptions(qIndex, rule.options, item.querySelector(`#opts-${qIndex}`));
    });
  };

  document.getElementById('rules-list').addEventListener('input', (e) => {
    const target = e.target;
    if (target.classList.contains('rule-text')) {
      const q = target.dataset.q;
      currentRules[q].text = target.value;
      target.closest('.accordion-item').querySelector('.accordion-button').textContent = `Pergunta ${parseInt(q) + 1}: ${target.value}`;
    } else if (target.classList.contains('opt-label')) {
      currentRules[target.dataset.q].options[target.dataset.o].label = target.value;
    } else if (target.classList.contains('opt-weight')) {
      currentRules[target.dataset.q].options[target.dataset.o].weight = parseFloat(target.value) || 0;
    } else if (target.classList.contains('opt-hours')) {
      currentRules[target.dataset.q].options[target.dataset.o].hours = parseFloat(target.value) || 0;
    }
  });

  document.getElementById('rules-list').addEventListener('click', (e) => {
    const target = e.target;
    if (target.closest('.btn-add-opt')) {
      const btn = target.closest('.btn-add-opt');
      currentRules[btn.dataset.q].options.push({ label: 'Nova Opção', weight: 0, hours: 0 });
      loadRulesUI();
      setTimeout(() => new bootstrap.Collapse(document.getElementById(`collapse-${btn.dataset.q}`), { toggle: false }).show(), 50);
    } else if (target.closest('.btn-del-opt')) {
      const btn = target.closest('.btn-del-opt');
      currentRules[btn.dataset.q].options.splice(btn.dataset.o, 1);
      loadRulesUI();
      setTimeout(() => new bootstrap.Collapse(document.getElementById(`collapse-${btn.dataset.q}`), { toggle: false }).show(), 50);
    } else if (target.closest('.btn-del-rule')) {
      if (confirm('Apagar esta pergunta inteira?')) {
        currentRules.splice(target.closest('.btn-del-rule').dataset.q, 1);
        loadRulesUI();
      }
    }
  });

  document.getElementById('btn-add-rule').addEventListener('click', () => {
    currentRules.push({ text: "Nova Pergunta?", options: [{ label: "Opção Padrão", weight: 0, hours: 0 }] });
    loadRulesUI();
  });

  document.getElementById('btn-save-rules').addEventListener('click', async () => {
    await window.StorageUtils.saveRules(currentRules);
    window.Engine.questions = currentRules;
    showToast('Regras salvas!');
    currentQuestion = 0;
    answers = new Array(window.Engine.questions.length).fill(null);
    renderQuestion();
  });

  document.getElementById('btn-restore-rules').addEventListener('click', async () => {
    if (confirm('Restaurar regras originais de fábrica?')) {
      currentRules = JSON.parse(JSON.stringify(window.Engine.defaultQuestions));
      await window.StorageUtils.saveRules(currentRules);
      window.Engine.questions = currentRules;
      loadRulesUI();
      showToast('Regras restauradas.');
      currentQuestion = 0;
      answers = new Array(window.Engine.questions.length).fill(null);
      renderQuestion();
    }
  });

  // ===== WIZARD =====
  let currentQuestion = 0;
  let answers = [];

  const renderQuestion = () => {
    if (!window.Engine.questions || window.Engine.questions.length === 0) return;
    if (answers.length !== window.Engine.questions.length) {
      answers = new Array(window.Engine.questions.length).fill(null);
    }

    const q = window.Engine.questions[currentQuestion];
    document.getElementById('wizard-question').innerText = q.text;
    document.getElementById('wizard-progress').style.width = `${(currentQuestion / window.Engine.questions.length) * 100}%`;
    document.getElementById('wizard-step-label').textContent = `Pergunta ${currentQuestion + 1} de ${window.Engine.questions.length}`;
    document.getElementById('btn-wizard-back').style.display = currentQuestion > 0 ? 'inline-block' : 'none';

    const container = document.getElementById('wizard-options');
    container.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const chip = document.createElement('div');
      chip.className = 'option-chip text-center fs-6';
      if (answers[currentQuestion] === idx) chip.classList.add('selected');
      chip.innerText = opt.label;
      chip.addEventListener('click', () => {
        answers[currentQuestion] = idx;
        renderQuestion();
        setTimeout(() => {
          if (currentQuestion < window.Engine.questions.length - 1) {
            currentQuestion++;
            renderQuestion();
          } else {
            document.getElementById('wizard-progress').style.width = '100%';
            showResult();
          }
        }, 150);
      });
      container.appendChild(chip);
    });
  };

  document.getElementById('btn-wizard-back').addEventListener('click', () => {
    if (currentQuestion > 0) { currentQuestion--; renderQuestion(); }
  });

  document.getElementById('nav-wizard').addEventListener('click', () => {
    currentQuestion = 0;
    answers.fill(null);
    renderQuestion();
    switchView('wizard');
  });

  // ===== RESULT / SAVE PROJECT =====
  let lastResult = null;
  let customExtras = [];

  const renderExtras = () => {
    const container = document.getElementById('extras-list');
    container.innerHTML = '';
    customExtras.forEach((extra, idx) => {
      const item = document.createElement('div');
      item.className = 'd-flex gap-2 align-items-center';
      item.innerHTML = `
        <input type="text" class="form-control bg-black border-secondary text-white extra-name" data-idx="${idx}" value="${extra.name}" placeholder="Ex: Domínio" style="flex:2;" />
        <input type="number" class="form-control bg-black border-secondary text-white extra-value" data-idx="${idx}" value="${extra.value}" placeholder="0,00" style="flex:1;" />
        <button class="btn btn-remove" data-idx="${idx}"><i class="bi bi-x-lg pointer-events-none"></i></button>
      `;
      container.appendChild(item);
    });

    container.querySelectorAll('.extra-name').forEach(el => el.addEventListener('input', (e) => customExtras[e.target.dataset.idx].name = e.target.value));
    container.querySelectorAll('.extra-value').forEach(el => el.addEventListener('input', (e) => customExtras[e.target.dataset.idx].value = parseFloat(e.target.value) || 0));
    container.querySelectorAll('.btn-remove').forEach(el => {
      el.addEventListener('click', (e) => {
        customExtras.splice(e.target.closest('button').dataset.idx, 1);
        renderExtras();
      });
    });
  };

  document.getElementById('btn-add-extra').addEventListener('click', () => { customExtras.push({ name: '', value: 0 }); renderExtras(); });

  const showResult = () => {
    lastResult = window.Engine.calculate(answers, config.hourlyRate);
    customExtras = [];
    renderExtras();

    document.getElementById('result-hours-value').textContent = `${lastResult.estimatedHours}h`;
    document.getElementById('price-min').innerText = formatCurrency(lastResult.minimum);
    document.getElementById('price-suggested').innerText = formatCurrency(lastResult.suggested);
    document.getElementById('price-premium').innerText = formatCurrency(lastResult.premium);
    document.getElementById('new-project-name').value = '';

    const list = document.getElementById('justifications-list');
    list.innerHTML = '';
    lastResult.justifications.forEach(j => {
      const li = document.createElement('li');
      li.className = "d-flex justify-content-between border-bottom border-secondary py-2";
      li.innerHTML = `<span>${j.label}</span><span class="text-primary fw-medium">${j.value}</span>`;
      list.appendChild(li);
    });
    switchView('resultado');
  };

  document.getElementById('btn-redo').addEventListener('click', () => {
    currentQuestion = 0;
    answers.fill(null);
    renderQuestion();
    switchView('wizard');
  });

  document.getElementById('btn-save-project').addEventListener('click', async () => {
    if (!lastResult) return;
    const pName = document.getElementById('new-project-name').value.trim();
    if (!pName) return showToast('Digite um nome para o projeto', 'error');

    let totalExtras = 0;
    customExtras.forEach(e => totalExtras += e.value);
    const finalValue = lastResult.suggested + totalExtras;

    const newProject = {
      id: Date.now().toString(),
      name: pName,
      targetValue: finalValue,
      estimatedHours: lastResult.estimatedHours,
      accumulatedSeconds: 0,
      status: 'active',
      createdAt: Date.now()
    };

    await window.StorageUtils.saveProject(newProject);
    showToast('Projeto criado com sucesso!');
    loadProjectsList();
    switchView('projects');
  });

  // ===== PROJECTS =====
  let loadProjectsList = async () => {
    const projects = await window.StorageUtils.listProjects();
    const container = document.getElementById('projects-list');
    container.innerHTML = '';

    if (projects.length === 0) {
      container.innerHTML = '<div class="col-12 text-center text-secondary py-5"><i class="bi bi-kanban fs-1 d-block mb-3"></i>Nenhum projeto ativo.<br/>Comece calculando um novo orçamento.</div>';
      return;
    }

    projects.forEach(p => {
      const col = document.createElement('div');
      col.className = 'col-12 col-lg-6';
      
      const isDone = p.status === 'done';
      const accumHours = p.accumulatedSeconds / 3600;
      const progressPercent = Math.min(100, (accumHours / p.estimatedHours) * 100) || 0;
      const progressColor = progressPercent > 100 ? 'bg-danger' : 'bg-primary';

      col.innerHTML = `
        <div class="card ${isDone ? 'bg-black' : 'bg-dark'} border-secondary h-100 p-3 rounded-4 shadow-sm" style="${isDone ? 'opacity:0.7;' : ''}">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="text-white mb-0 fw-bold">${p.name}</h6>
            <div class="dropdown">
              <button class="btn btn-sm text-secondary" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
              <ul class="dropdown-menu dropdown-menu-dark bg-black border-secondary">
                <li><a class="dropdown-item proj-toggle-status" href="#" data-id="${p.id}">${isDone ? 'Marcar como Ativo' : 'Marcar como Concluído'}</a></li>
                <li><hr class="dropdown-divider border-secondary"></li>
                <li><a class="dropdown-item text-danger proj-delete" href="#" data-id="${p.id}">Excluir</a></li>
              </ul>
            </div>
          </div>
          <div class="d-flex justify-content-between font-monospace small mb-3">
            <span class="text-secondary"><i class="bi bi-clock"></i> ${formatTime(p.accumulatedSeconds)} / ${p.estimatedHours}h</span>
            <span class="text-primary fw-bold">${formatCurrency(p.targetValue)}</span>
          </div>
          
          <div class="progress mb-3" style="height: 4px;">
            <div class="progress-bar ${progressColor}" style="width: ${progressPercent}%"></div>
          </div>

          <button class="btn ${isDone ? 'btn-outline-secondary' : 'btn-primary'} btn-sm w-100 rounded-pill fw-semibold btn-play-proj" data-id="${p.id}">
            ${isDone ? '<i class="bi bi-eye"></i> Ver' : '<i class="bi bi-play-fill"></i> Cronometrar'}
          </button>
        </div>
      `;
      container.appendChild(col);
    });

    // Events
    container.querySelectorAll('.proj-delete').forEach(btn => btn.addEventListener('click', async (e) => {
      if (confirm('Apagar este projeto e suas horas rastreadas?')) {
        await window.StorageUtils.deleteProject(e.target.dataset.id);
        loadProjectsList();
      }
    }));

    container.querySelectorAll('.proj-toggle-status').forEach(btn => btn.addEventListener('click', async (e) => {
      const pId = e.target.dataset.id;
      const projects = await window.StorageUtils.listProjects();
      const p = projects.find(x => x.id === pId);
      if (p) {
        p.status = p.status === 'done' ? 'active' : 'done';
        await window.StorageUtils.saveProject(p);
        loadProjectsList();
      }
    }));

    container.querySelectorAll('.btn-play-proj').forEach(btn => btn.addEventListener('click', async (e) => {
      const pId = e.target.closest('button').dataset.id;
      const projects = await window.StorageUtils.listProjects();
      const p = projects.find(x => x.id === pId);
      if (p) {
        setActiveTimerProject(p);
        switchView('timer');
      }
    }));
    
    if (typeof updateGlobalProjectDropdown === 'function') {
      updateGlobalProjectDropdown();
    }
  };

  document.getElementById('btn-go-wizard').addEventListener('click', () => {
    currentQuestion = 0;
    answers.fill(null);
    renderQuestion();
    switchView('wizard');
  });

  // ===== TIMER LOGIC =====
  let activeProject = null;
  let timerInterval = null;

  const getTimerData = () => {
    const data = localStorage.getItem('timerData');
    return data ? JSON.parse(data) : { timerRunning: false, timerStart: null, accumulatedSession: 0, activeProjectId: null };
  };
  const setTimerData = (data) => {
    localStorage.setItem('timerData', JSON.stringify(data));
  };

  let setActiveTimerProject = async (proj) => {
    const tData = getTimerData();
    
    // Se há um timer rodando em outro projeto, salva as horas no projeto antigo
    if (tData.timerRunning && activeProject && activeProject.id !== proj.id) {
      const elapsed = Math.floor((Date.now() - tData.timerStart) / 1000);
      const sessionSecs = tData.accumulatedSession + elapsed;
      if (sessionSecs > 0) {
         activeProject.accumulatedSeconds += sessionSecs;
         await window.StorageUtils.saveProject(activeProject);
         showToast(`Sessão salva no projeto anterior.`);
      }
    } else if (tData.accumulatedSession > 0 && activeProject && activeProject.id !== proj.id) {
      activeProject.accumulatedSeconds += tData.accumulatedSession;
      await window.StorageUtils.saveProject(activeProject);
    }

    activeProject = proj;
    setTimerData({ timerRunning: false, timerStart: null, accumulatedSession: 0, activeProjectId: proj.id });
    
    if (typeof updateGlobalProjectDropdown === 'function') updateGlobalProjectDropdown();
    if (typeof renderTasks === 'function') renderTasks();
    updateTimerUI();
  };

  let updateTimerUI = async () => {
    const tData = getTimerData();
    
    // Se não há projeto selecionado mas tem ID no state, recarrega
    if (!activeProject && tData.activeProjectId) {
      const projects = await window.StorageUtils.listProjects();
      activeProject = projects.find(p => p.id === tData.activeProjectId);
    }

    if (!activeProject) {
      document.getElementById('active-project-name').textContent = "Nenhum projeto selecionado";
      document.getElementById('active-project-meta').textContent = "Selecione um projeto na aba Projetos";
      document.getElementById('btn-timer-start').classList.add('disabled');
      document.getElementById('timer-display').innerText = "00:00:00";
      return;
    }

    document.getElementById('btn-timer-start').classList.remove('disabled');
    document.getElementById('active-project-name').textContent = activeProject.name;
    document.getElementById('active-project-meta').innerHTML = `Meta: <span class="text-primary">${formatCurrency(activeProject.targetValue)}</span> | Orçado: ${activeProject.estimatedHours}h`;
    document.getElementById('target-value').textContent = formatCurrency(activeProject.targetValue);

    let sessionSeconds = tData.accumulatedSession || 0;
    if (tData.timerRunning && tData.timerStart) {
      sessionSeconds += Math.floor((Date.now() - tData.timerStart) / 1000);
    }

    const totalProjectSeconds = (activeProject.accumulatedSeconds || 0) + sessionSeconds;
    
    document.getElementById('timer-display').innerText = formatTime(totalProjectSeconds);
    const moneyEarned = (totalProjectSeconds / 3600) * (config.hourlyRate || 50);
    document.getElementById('timer-value').innerText = formatCurrency(moneyEarned);

    const percent = Math.min(100, (moneyEarned / activeProject.targetValue) * 100);
    document.getElementById('timer-progress').style.width = `${percent}%`;

    const dot = document.getElementById('timer-status-dot');
    const btnStart = document.getElementById('btn-timer-start');
    const btnPause = document.getElementById('btn-timer-pause');
    const btnReset = document.getElementById('btn-timer-reset');

    if (tData.timerRunning) {
      dot.className = 'status-dot running';
      btnStart.style.display = 'none';
      btnPause.style.display = 'block';
      btnReset.classList.add('disabled');
    } else if (sessionSeconds > 0) {
      dot.className = 'status-dot paused';
      btnStart.style.display = 'block';
      btnStart.innerHTML = '<i class="bi bi-play-fill"></i> Retomar';
      btnPause.style.display = 'none';
      btnReset.classList.remove('disabled');
    } else {
      dot.className = 'status-dot stopped';
      btnStart.style.display = 'block';
      btnStart.innerHTML = '<i class="bi bi-play-fill"></i> Iniciar';
      btnPause.style.display = 'none';
      btnReset.classList.add('disabled');
    }

    if (activeProject && document.getElementById('tasks-list').innerHTML === '') {
      if (typeof renderTasks === 'function') renderTasks();
    } else if (!activeProject) {
      document.getElementById('task-block').classList.add('d-none');
    }
  };

  timerInterval = setInterval(updateTimerUI, 1000);

  document.getElementById('btn-timer-start').addEventListener('click', () => {
    if (!activeProject) return;
    const data = getTimerData();
    if (!data.timerRunning) {
      data.timerRunning = true;
      data.timerStart = Date.now();
      setTimerData(data);
      showToast('Cronômetro iniciado!');
    }
    updateTimerUI();
  });

  document.getElementById('btn-timer-pause').addEventListener('click', () => {
    const data = getTimerData();
    if (data.timerRunning && data.timerStart) {
      data.accumulatedSession += Math.floor((Date.now() - data.timerStart) / 1000);
      data.timerRunning = false;
      data.timerStart = null;
      setTimerData(data);
      showToast('Cronômetro pausado.');
    }
    updateTimerUI();
  });

  document.getElementById('btn-timer-reset').addEventListener('click', async () => {
    if (!activeProject) return;
    const data = getTimerData();
    
    if (data.accumulatedSession > 0) {
      if (confirm('Deseja salvar esta sessão e adicionar as horas ao projeto?')) {
        // Atualiza o projeto no banco de dados
        activeProject.accumulatedSeconds += data.accumulatedSession;
        await window.StorageUtils.saveProject(activeProject);
        
        // Reseta o estado local do timer
        setTimerData({ timerRunning: false, timerStart: null, accumulatedSession: 0, activeProjectId: activeProject.id });
        updateTimerUI();
        showToast('Horas salvas no projeto!');
      }
    }
  });

// ====== Add at the very end of popup.js (before the timeout) ======

  // ===== GLOBAL PROJECT SELECTOR & TASKS =====
  
  const updateGlobalProjectDropdown = async () => {
    const projects = await window.StorageUtils.listProjects();
    const dropdown = document.getElementById('global-project-list');
    const headerTitle = document.getElementById('global-project-name');
    
    dropdown.innerHTML = '';
    const activeProjects = projects.filter(p => p.status === 'active');
    
    if (activeProjects.length === 0) {
      dropdown.innerHTML = '<li><span class="dropdown-item-text text-secondary small">Nenhum projeto ativo</span></li>';
      if (!activeProject) headerTitle.innerHTML = '<span class="logo-t">Timer</span><span class="logo-r">Rent</span>';
      return;
    }

    if (activeProject) {
      headerTitle.textContent = activeProject.name;
    }

    activeProjects.forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `<a class="dropdown-item text-white ${activeProject && activeProject.id === p.id ? 'active bg-primary' : ''}" href="#" data-id="${p.id}">${p.name}</a>`;
      dropdown.appendChild(li);
    });

    dropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const pId = e.target.dataset.id;
        const proj = activeProjects.find(x => x.id === pId);
        if (proj) {
          setActiveTimerProject(proj);
          switchView('timer');
          updateGlobalProjectDropdown();
        }
      });
    });
  };

  // Monkey patch removido. loadProjectsList foi atualizado diretamente.

  // ===== TASK BLOCK (OBSIDIAN STYLE) =====
  
  const renderTasks = () => {
    const taskBlock = document.getElementById('task-block');
    const tasksList = document.getElementById('tasks-list');
    
    if (!activeProject) {
      taskBlock.classList.add('d-none');
      return;
    }
    
    taskBlock.classList.remove('d-none');
    tasksList.innerHTML = '';
    
    if (!activeProject.tasks) activeProject.tasks = [];
    
    if (activeProject.tasks.length === 0) {
      tasksList.innerHTML = '<div class="text-secondary small text-center my-3">Nenhuma tarefa criada.</div>';
    }

    activeProject.tasks.forEach((t, idx) => {
      const item = document.createElement('div');
      item.className = `task-item ${t.done ? 'done' : ''}`;
      item.innerHTML = `
        <div class="task-checkbox" data-idx="${idx}"><i class="bi bi-check2 pointer-events-none"></i></div>
        <div class="task-text" data-idx="${idx}">${t.text}</div>
        <button class="btn btn-sm btn-link text-secondary p-0 btn-del-task" data-idx="${idx}"><i class="bi bi-x pointer-events-none"></i></button>
      `;
      tasksList.appendChild(item);
    });

    // Checkbox toggle
    tasksList.querySelectorAll('.task-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-del-task')) return; // Ignore if clicking delete
        const idx = e.target.closest('.task-item').querySelector('.task-checkbox').dataset.idx;
        activeProject.tasks[idx].done = !activeProject.tasks[idx].done;
        await window.StorageUtils.saveProject(activeProject);
        renderTasks();
      });
    });

    // Delete task
    tasksList.querySelectorAll('.btn-del-task').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = e.target.dataset.idx;
        activeProject.tasks.splice(idx, 1);
        await window.StorageUtils.saveProject(activeProject);
        renderTasks();
      });
    });
  };

  document.getElementById('btn-add-task').addEventListener('click', async () => {
    if (!activeProject) return;
    const input = document.getElementById('new-task-input');
    const text = input.value.trim();
    if (!text) return;

    if (!activeProject.tasks) activeProject.tasks = [];
    activeProject.tasks.push({ text: text, done: false });
    
    await window.StorageUtils.saveProject(activeProject);
    input.value = '';
    renderTasks();
  });

  document.getElementById('new-task-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-add-task').click();
  });

  // Monkey patches removidos. As funções originais foram atualizadas com o comportamento integrado.

  // Start with wizard state sync
  setTimeout(() => {
    renderQuestion();
    updateGlobalProjectDropdown();
  }, 500);
});
