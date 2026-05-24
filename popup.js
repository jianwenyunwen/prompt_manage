// ==================== //
// DOM 元素             //
// ==================== //
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// 标签页
const tabs = $$('.tab');
const tabContents = $$('.tab-content');

// 新建 Prompt 表单
const selectedIcon = $('#selected-icon');
const iconGrid = $('#icon-grid');
const promptTitle = $('#prompt-title');
const promptDesc = $('#prompt-desc');
const promptContent = $('#prompt-content');
const promptCategory = $('#prompt-category');
const tagsContainer = $('#tags-container');
const tagInput = $('#tag-input');
const btnSave = $('#btn-save');

// 我的 Prompts
const searchInput = $('#search-input');
const filterBtns = $$('.filter-btn');
const promptsList = $('#prompts-list');

// 设置项
const btnImportJson = $('#btn-import-json');
const btnImportAipm = $('#btn-import-aipm');
const btnExportCsv = $('#btn-export-csv');
const btnEvaluation = $('#btn-evaluation');
const btnApiConfig = $('#btn-api-config');
const btnManageTags = $('#btn-manage-tags');
const themeToggle = $('#theme-toggle');
const themeLabel = $('#theme-label');

// 弹窗
const modalOverlay = $('#modal-overlay');
const modalTitle = $('#modal-title');
const modalBody = $('#modal-body');
const modalClose = $('#modal-close');
const editModalOverlay = $('#edit-modal-overlay');
const editModalBody = $('#edit-modal-body');
const editModalClose = $('#edit-modal-close');

// 提示
const toast = $('#toast');

// ==================== //
// 状态                 //
// ==================== //
let currentIcon = ' ';
let currentTags = [];
let currentCategory = 'all';
let editingPromptId = null;

// ==================== //
// 初始化               //
// ==================== //
document.addEventListener('DOMContentLoaded', async () => {
  await Storage.seedDefaults();
  await initTheme();
  initTabs();
  initIconSelector();
  initTagsInput();
  initForm();
  initSearch();
  initFilters();
  initSettings();
  initModals();
  await renderPrompts();
});

// ==================== //
// 主题                 //
// ==================== //
async function initTheme() {
  const theme = await Storage.getTheme();
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.checked = theme === 'dark';
  updateThemeUI(theme);
}

function updateThemeUI(theme) {
  const moonIcon = $('.moon-icon');
  const sunIcon = $('.sun-icon');
  if (theme === 'dark') {
    moonIcon.style.display = 'none';
    sunIcon.style.display = 'block';
    themeLabel.textContent = '浅色模式';
  } else {
    moonIcon.style.display = 'block';
    sunIcon.style.display = 'none';
    themeLabel.textContent = '深色模式';
  }
}

// ==================== //
// 标签页切换           //
// ==================== //
function initTabs() {
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      $(`#${target}`).classList.add('active');
    });
  });
}

// ==================== //
// 图标选择器           //
// ==================== //
function initIconSelector() {
  selectedIcon.addEventListener('click', () => {
    iconGrid.style.display = iconGrid.style.display === 'none' ? 'flex' : 'none';
  });

  iconGrid.querySelectorAll('.icon-option').forEach(opt => {
    opt.addEventListener('click', () => {
      iconGrid.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      currentIcon = opt.getAttribute('data-icon');
      selectedIcon.textContent = currentIcon;
      iconGrid.style.display = 'none';
    });
  });
}

// ==================== //
// 标签输入             //
// ==================== //
function initTagsInput() {
  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tagInput.value.trim();
      if (val) {
        const tags = val.split(',').map(t => t.trim()).filter(t => t && !currentTags.includes(t));
        tags.forEach(t => currentTags.push(t));
        tagInput.value = '';
        renderTags();
      }
    }
  });

  tagInput.addEventListener('input', () => {
    const hint = $('.tags-hint');
    hint.style.display = tagInput.value ? 'none' : 'block';
  });
}

function renderTags() {
  tagsContainer.innerHTML = currentTags.map(tag => `
    <span class="tag">
      ${escapeHtml(tag)}
      <button class="tag-remove" data-tag="${escapeHtml(tag)}">&times;</button>
    </span>
  `).join('');

  tagsContainer.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTags = currentTags.filter(t => t !== btn.getAttribute('data-tag'));
      renderTags();
    });
  });
}

// ==================== //
// 表单提交             //
// ==================== //
function initForm() {
  btnSave.addEventListener('click', async () => {
    const title = promptTitle.value.trim();
    const description = promptDesc.value.trim();
    const content = promptContent.value.trim();
    const category = promptCategory.value;

    if (!title) {
      showToast('请输入标题');
      return;
    }
    if (!content) {
      showToast('请输入 Prompt 内容');
      return;
    }

    await Storage.addPrompt({
      icon: currentIcon,
      title,
      description,
      content,
      category,
      tags: [...currentTags]
    });

    // 重置表单
    promptTitle.value = '';
    promptDesc.value = '';
    promptContent.value = '';
    promptCategory.value = '提示词工程';
    currentIcon = ' ';
    selectedIcon.textContent = currentIcon;
    currentTags = [];
    renderTags();
    iconGrid.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));

    showToast('Prompt 保存成功！');
    await renderPrompts();
  });
}

// ==================== //
// 搜索 & 筛选         //
// ==================== //
function initSearch() {
  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      await renderPrompts();
    }, 300);
  });
}

function initFilters() {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      renderPrompts();
    });
  });
}

// ==================== //
// 渲染 Prompt 列表    //
// ==================== //
async function renderPrompts() {
  let prompts = await Storage.getPrompts();
  const query = searchInput.value.trim();

  if (query) {
    prompts = prompts.filter(p =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      p.content.toLowerCase().includes(query.toLowerCase()) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(query.toLowerCase())))
    );
  }

  if (currentCategory !== 'all') {
    prompts = prompts.filter(p => p.category === currentCategory);
  }

  if (prompts.length === 0) {
    promptsList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <p>${query ? '没有找到匹配的 Prompt' : '还没有 Prompt，快去创建一个吧！'}</p>
      </div>
    `;
    return;
  }

  promptsList.innerHTML = prompts.map(p => `
    <div class="prompt-card" data-id="${p.id}">
      <div class="prompt-card-header">
        <div class="prompt-card-icon">${p.icon || ' '}</div>
        <div class="prompt-card-info">
          <div class="prompt-card-title">${escapeHtml(p.title)}</div>
          <div class="prompt-card-desc">${escapeHtml(p.description || '')}</div>
        </div>
      </div>
      <div class="prompt-card-content">${escapeHtml(p.content)}</div>
      <div class="prompt-card-footer">
        <div class="prompt-card-tags">
          ${(p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <button class="btn-edit" data-id="${p.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          编辑
        </button>
      </div>
    </div>
  `).join('');

  // 点击卡片复制内容
  promptsList.querySelectorAll('.prompt-card').forEach(card => {
    card.addEventListener('click', async (e) => {
      if (e.target.closest('.btn-edit')) return;
      const id = card.getAttribute('data-id');
      const prompt = (await Storage.getPrompts()).find(p => p.id === id);
      if (prompt) {
        try {
          await navigator.clipboard.writeText(prompt.content);
          showToast('已复制到剪贴板！');
        } catch {
          showToast('复制失败');
        }
      }
    });
  });

  // 编辑按钮
  promptsList.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      openEditModal(id);
    });
  });
}

// ==================== //
// 设置功能             //
// ==================== //
function initSettings() {
  // 导入/导出 JSON
  btnImportJson.addEventListener('click', () => openImportExportModal());

  // 从 AIPM 导入
  btnImportAipm.addEventListener('click', () => openAipmImportModal());

  // 导出 CSV
  btnExportCsv.addEventListener('click', async () => {
    const csv = await Storage.exportCSV();
    downloadFile(csv, 'prompts.csv', 'text/csv');
    showToast('CSV 导出成功！');
  });

  // Prompt 评估
  btnEvaluation.addEventListener('click', () => openEvaluationModal());

  // API 配置
  btnApiConfig.addEventListener('click', () => openApiConfigModal());

  // 管理标签
  btnManageTags.addEventListener('click', () => openManageTagsModal());

  // 主题切换
  themeToggle.addEventListener('change', async () => {
    const theme = themeToggle.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    await Storage.setTheme(theme);
    updateThemeUI(theme);
  });
}

// ==================== //
// 弹窗功能             //
// ==================== //
function initModals() {
  modalClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
  editModalClose.addEventListener('click', () => editModalOverlay.classList.remove('active'));
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('active');
  });
  editModalOverlay.addEventListener('click', (e) => {
    if (e.target === editModalOverlay) editModalOverlay.classList.remove('active');
  });
}

function openImportExportModal() {
  modalTitle.textContent = '导入 / 导出 JSON';
  modalBody.innerHTML = `
    <p style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">复制或粘贴你的 Prompts JSON 数据：</p>
    <textarea id="json-data" placeholder="在此粘贴 JSON 数据..."></textarea>
    <div class="modal-actions">
      <button class="btn-secondary" id="btn-copy-json">复制</button>
      <button class="btn-primary" id="btn-import-json-data">导入</button>
    </div>
    <div class="modal-actions" style="margin-top:6px;">
      <button class="btn-primary" id="btn-export-json-data" style="width:100%;">导出并下载</button>
    </div>
  `;
  modalOverlay.classList.add('active');

  $('#btn-copy-json').addEventListener('click', async () => {
    const json = await Storage.exportJSON();
    $('#json-data').value = json;
    await navigator.clipboard.writeText(json);
    showToast('JSON 已复制到剪贴板！');
  });

  $('#btn-import-json-data').addEventListener('click', async () => {
    const data = $('#json-data').value.trim();
    if (!data) { showToast('请先粘贴 JSON 数据'); return; }
    const result = await Storage.importJSON(data);
    if (result.success) {
      showToast(`成功导入 ${result.added} / ${result.total} 条 Prompt！`);
      modalOverlay.classList.remove('active');
      await renderPrompts();
    } else {
      showToast('导入失败：' + result.error);
    }
  });

  $('#btn-export-json-data').addEventListener('click', async () => {
    const json = await Storage.exportJSON();
    downloadFile(json, 'prompts.json', 'application/json');
    showToast('JSON 已导出！');
  });
}

function openAipmImportModal() {
  modalTitle.textContent = '从 AIPM 导入';
  modalBody.innerHTML = `
    <p style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">粘贴从 AIPM 导出的 JSON 数据：</p>
    <textarea id="aipm-data" placeholder="在此粘贴 AIPM JSON 数据..."></textarea>
    <div class="modal-actions">
      <button class="btn-secondary" id="btn-cancel-aipm">取消</button>
      <button class="btn-primary" id="btn-import-aipm">导入</button>
    </div>
  `;
  modalOverlay.classList.add('active');

  $('#btn-cancel-aipm').addEventListener('click', () => modalOverlay.classList.remove('active'));
  $('#btn-import-aipm').addEventListener('click', async () => {
    const data = $('#aipm-data').value.trim();
    if (!data) { showToast('请粘贴 AIPM 数据'); return; }
    const result = await Storage.importJSON(data);
    if (result.success) {
      showToast(`从 AIPM 导入了 ${result.added} 条 Prompt！`);
      modalOverlay.classList.remove('active');
      await renderPrompts();
    } else {
      showToast('导入失败：' + result.error);
    }
  });
}

function openEvaluationModal() {
  modalTitle.textContent = 'Prompt 评估';
  modalBody.innerHTML = `
    <p style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">输入 Prompt 进行质量评估：</p>
    <textarea id="eval-prompt" placeholder="在此粘贴你的 Prompt 进行评估..." style="min-height:120px;"></textarea>
    <button class="btn-primary" id="btn-eval" style="width:100%;margin-top:10px;">开始评估</button>
    <div id="eval-result" style="margin-top:12px;"></div>
  `;
  modalOverlay.classList.add('active');

  $('#btn-eval').addEventListener('click', () => {
    const text = $('#eval-prompt').value.trim();
    if (!text) { showToast('请输入 Prompt'); return; }

    const scores = evaluatePrompt(text);
    $('#eval-result').innerHTML = `
      <div style="border:1px solid var(--border-color);border-radius:var(--radius-md);padding:12px;">
        <div style="font-weight:600;margin-bottom:8px;">评估结果</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>清晰度</span><span style="font-weight:600;">${scores.clarity}/10</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>具体性</span><span style="font-weight:600;">${scores.specificity}/10</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>结构化</span><span style="font-weight:600;">${scores.structure}/10</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>综合评分</span><span style="font-weight:600;color:var(--accent-color);">${scores.overall}/10</span>
        </div>
        <div style="margin-top:8px;font-size:12px;color:var(--text-secondary);">
          ${scores.tips.map(t => `<div> ${t}</div>`).join('')}
        </div>
      </div>
    `;
  });
}

function evaluatePrompt(text) {
  const wordCount = text.split(/\s+/).length;
  const hasContext = /上下文|背景|context|based on|given/i.test(text);
  const hasRole = /你是|扮演|角色|你作为|you are|act as|role|assistant/i.test(text);
  const hasFormat = /格式|json|markdown|列表|结构化|format/i.test(text);
  const hasConstraints = /必须|应该|不要|避免|限制|must|should|don't|avoid|limit/i.test(text);
  const hasExamples = /例如|比如|举例|e\.g\.|such as|example/i.test(text);

  let clarity = 5;
  if (wordCount > 20) clarity += 1;
  if (wordCount > 50) clarity += 1;
  if (hasContext) clarity += 1;
  if (hasRole) clarity += 1;
  if (text.includes('\n')) clarity += 1;
  clarity = Math.min(clarity, 10);

  let specificity = 4;
  if (hasConstraints) specificity += 2;
  if (hasExamples) specificity += 2;
  if (hasFormat) specificity += 1;
  if (wordCount > 30) specificity += 1;
  specificity = Math.min(specificity, 10);

  let structure = 4;
  if (text.includes('\n')) structure += 2;
  if (hasRole) structure += 1;
  if (hasFormat) structure += 1;
  if (/步骤|1\.|2\.|首先|然后|最后|step|first|then|finally/i.test(text)) structure += 2;
  structure = Math.min(structure, 10);

  const overall = Math.round((clarity + specificity + structure) / 3);

  const tips = [];
  if (!hasRole) tips.push('建议添加角色定义（如"你是一个..."）');
  if (!hasFormat) tips.push('建议指定期望的输出格式');
  if (!hasConstraints) tips.push('建议添加约束条件或指导方针');
  if (!hasExamples) tips.push('建议添加示例以获得更好的效果');
  if (wordCount < 20) tips.push('建议增加更多细节以提高清晰度');
  if (tips.length === 0) tips.push('这是一个结构良好的 Prompt！');

  return { clarity, specificity, structure, overall, tips };
}

async function openApiConfigModal() {
  const config = await Storage.getApiConfig();
  modalTitle.textContent = 'API 配置';
  modalBody.innerHTML = `
    <div class="edit-form">
      <div class="form-group">
        <label>服务商</label>
        <select id="api-provider">
          <option value="openai" ${config.provider === 'openai' ? 'selected' : ''}>OpenAI</option>
          <option value="anthropic" ${config.provider === 'anthropic' ? 'selected' : ''}>Anthropic</option>
          <option value="google" ${config.provider === 'google' ? 'selected' : ''}>Google</option>
        </select>
      </div>
      <div class="form-group">
        <label>API Key</label>
        <input type="password" id="api-key" value="${escapeHtml(config.key || '')}" placeholder="sk-...">
      </div>
      <div class="form-group">
        <label>模型</label>
        <input type="text" id="api-model" value="${escapeHtml(config.model || 'gpt-4')}" placeholder="gpt-4">
      </div>
    </div>
    <div class="modal-actions" style="margin-top:14px;">
      <button class="btn-secondary" id="btn-cancel-api">取消</button>
      <button class="btn-primary" id="btn-save-api">保存</button>
    </div>
  `;
  modalOverlay.classList.add('active');

  $('#btn-cancel-api').addEventListener('click', () => modalOverlay.classList.remove('active'));
  $('#btn-save-api').addEventListener('click', async () => {
    await Storage.setApiConfig({
      provider: $('#api-provider').value,
      key: $('#api-key').value,
      model: $('#api-model').value
    });
    showToast('API 配置已保存！');
    modalOverlay.classList.remove('active');
  });
}

async function openManageTagsModal() {
  const tags = await Storage.getAllTags();
  modalTitle.textContent = '管理标签';
  modalBody.innerHTML = `
    <p style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">所有 Prompt 中使用的标签：</p>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">
      ${tags.length > 0 ? tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') : '<span style="color:var(--text-muted);font-size:12px;">暂无标签</span>'}
    </div>
    <p style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">共 ${tags.length} 个标签</p>
  `;
  modalOverlay.classList.add('active');
}

async function openEditModal(id) {
  const prompts = await Storage.getPrompts();
  const prompt = prompts.find(p => p.id === id);
  if (!prompt) return;

  editingPromptId = id;
  const editTags = [...(prompt.tags || [])];

  editModalBody.innerHTML = `
    <div class="edit-form">
      <div class="form-group">
        <label>图标</label>
        <input type="text" id="edit-icon" value="${escapeHtml(prompt.icon || ' ')}" placeholder=" ">
      </div>
      <div class="form-group">
        <label>标题</label>
        <input type="text" id="edit-title" value="${escapeHtml(prompt.title)}">
      </div>
      <div class="form-group">
        <label>描述</label>
        <input type="text" id="edit-desc" value="${escapeHtml(prompt.description || '')}">
      </div>
      <div class="form-group">
        <label>Prompt 内容</label>
        <textarea id="edit-content" rows="5">${escapeHtml(prompt.content)}</textarea>
      </div>
      <div class="form-group">
        <label>分类</label>
        <select id="edit-category">
          ${['提示词工程','写作','翻译','编程','营销','教育','商务','创意','其他']
            .map(c => `<option value="${c}" ${prompt.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>标签（逗号分隔）</label>
        <input type="text" id="edit-tags" value="${editTags.join(', ')}">
      </div>
    </div>
    <div class="modal-actions" style="margin-top:14px;">
      <button class="btn-secondary" id="btn-cancel-edit">取消</button>
      <button class="btn-primary" id="btn-save-edit">保存修改</button>
    </div>
    <button class="btn-delete" id="btn-delete-prompt">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
      删除 Prompt
    </button>
  `;
  editModalOverlay.classList.add('active');

  $('#btn-cancel-edit').addEventListener('click', () => editModalOverlay.classList.remove('active'));

  $('#btn-save-edit').addEventListener('click', async () => {
    const title = $('#edit-title').value.trim();
    const content = $('#edit-content').value.trim();
    if (!title || !content) {
      showToast('标题和内容不能为空');
      return;
    }
    await Storage.updatePrompt(id, {
      icon: $('#edit-icon').value.trim() || ' ',
      title,
      description: $('#edit-desc').value.trim(),
      content,
      category: $('#edit-category').value,
      tags: $('#edit-tags').value.split(',').map(t => t.trim()).filter(t => t)
    });
    showToast('Prompt 已更新！');
    editModalOverlay.classList.remove('active');
    await renderPrompts();
  });

  $('#btn-delete-prompt').addEventListener('click', async () => {
    if (confirm('确定要删除这个 Prompt 吗？')) {
      await Storage.deletePrompt(id);
      showToast('Prompt 已删除');
      editModalOverlay.classList.remove('active');
      await renderPrompts();
    }
  });
}

// ==================== //
// 工具函数             //
// ==================== //
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
