// Chrome 扩展存储工具
const Storage = {
  // 获取所有 Prompts
  async getPrompts() {
    const result = await chrome.storage.local.get(['prompts']);
    return result.prompts || [];
  },

  // 保存所有 Prompts
  async savePrompts(prompts) {
    await chrome.storage.local.set({ prompts });
  },

  // 添加新 Prompt
  async addPrompt(prompt) {
    const prompts = await this.getPrompts();
    prompt.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    prompt.createdAt = new Date().toISOString();
    prompt.updatedAt = new Date().toISOString();
    prompts.unshift(prompt);
    await this.savePrompts(prompts);
    return prompt;
  },

  // 更新 Prompt
  async updatePrompt(id, updates) {
    const prompts = await this.getPrompts();
    const index = prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      prompts[index] = { ...prompts[index], ...updates, updatedAt: new Date().toISOString() };
      await this.savePrompts(prompts);
      return prompts[index];
    }
    return null;
  },

  // 删除 Prompt
  async deletePrompt(id) {
    const prompts = await this.getPrompts();
    const filtered = prompts.filter(p => p.id !== id);
    await this.savePrompts(filtered);
  },

  // 搜索 Prompts
  async searchPrompts(query) {
    const prompts = await this.getPrompts();
    const q = query.toLowerCase();
    return prompts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  },

  // 按分类获取 Prompts
  async getPromptsByCategory(category) {
    if (category === 'all') return this.getPrompts();
    const prompts = await this.getPrompts();
    return prompts.filter(p => p.category === category);
  },

  // 获取主题
  async getTheme() {
    const result = await chrome.storage.local.get(['theme']);
    return result.theme || 'light';
  },

  // 设置主题
  async setTheme(theme) {
    await chrome.storage.local.set({ theme });
  },

  // 获取 API 配置
  async getApiConfig() {
    const result = await chrome.storage.local.get(['apiConfig']);
    return result.apiConfig || { provider: 'openai', key: '', model: 'gpt-4' };
  },

  // 设置 API 配置
  async setApiConfig(config) {
    await chrome.storage.local.set({ apiConfig: config });
  },

  // 导出 JSON
  async exportJSON() {
    const prompts = await this.getPrompts();
    return JSON.stringify(prompts, null, 2);
  },

  // 导入 JSON
  async importJSON(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (!Array.isArray(imported)) throw new Error('格式无效');
      const existing = await this.getPrompts();
      const existingIds = new Set(existing.map(p => p.id));
      let added = 0;
      for (const p of imported) {
        if (p.title && p.content && !existingIds.has(p.id)) {
          p.id = p.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
          existing.push(p);
          added++;
        }
      }
      await this.savePrompts(existing);
      return { success: true, added, total: imported.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // 导出 CSV
  async exportCSV() {
    const prompts = await this.getPrompts();
    const headers = ['id', 'icon', 'title', 'description', 'content', 'category', 'tags', 'createdAt', 'updatedAt'];
    const rows = prompts.map(p => [
      p.id,
      p.icon || '',
      `"${(p.title || '').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      `"${(p.content || '').replace(/"/g, '""')}"`,
      p.category || '',
      `"${(p.tags || []).join(',')}"`,
      p.createdAt || '',
      p.updatedAt || ''
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  // 获取所有标签
  async getAllTags() {
    const prompts = await this.getPrompts();
    const tagSet = new Set();
    prompts.forEach(p => {
      if (p.tags) p.tags.forEach(t => tagSet.add(t));
    });
    return [...tagSet].sort();
  },

  // 初始化默认 Prompts
  async seedDefaults() {
    const existing = await this.getPrompts();
    if (existing.length > 0) return;

    const defaults = [
      {
        icon: ' ',
        title: '翻译成中文',
        description: '将任意内容翻译成中文',
        content: '请将以下文本翻译成中文，保持原文的语气和风格，确保翻译自然流畅。',
        category: '翻译',
        tags: ['翻译', '中文']
      },
      {
        icon: ' ',
        title: '翻译并保持格式',
        description: '翻译成中文并保留 Markdown 格式',
        content: '请将以下文本翻译成中文，同时保留所有 Markdown 格式，包括标题、列表、代码块、链接和强调标记。确保翻译准确自然。',
        category: '翻译',
        tags: ['翻译', '中文', 'Markdown']
      },
      {
        icon: ' ',
        title: '简洁总结',
        description: '对内容进行简洁的总结概括',
        content: '请对以下内容进行简洁的总结，聚焦关键要点和核心思想。总结要简明扼要但全面。',
        category: '写作',
        tags: ['总结', '写作']
      },
      {
        icon: ' ',
        title: 'YouTube 视频脚本',
        description: '为 YouTube 视频撰写完整脚本',
        content: '请为以下主题撰写一个引人入胜的 YouTube 视频脚本：[主题]。包括：前10秒的吸引注意力的开场、清晰的时间戳结构、流畅的过渡衔接、以及结尾的强烈行动号召。',
        category: '写作',
        tags: ['YouTube', '脚本', '视频']
      },
      {
        icon: ' ',
        title: '爆款推文生成器',
        description: '创建有传播力的社交媒体推文',
        content: '请写一条关于[主题]的爆款推文。推文要引人入胜、发人深省，能引发转发和回复。使用对话式的语气，并添加相关话题标签。',
        category: '营销',
        tags: ['推文', '社交媒体', '营销']
      },
      {
        icon: '  ',
        title: '代码审查助手',
        description: '审查代码中的 Bug、性能和最佳实践',
        content: '请审查以下代码，关注：\n1. Bug 和潜在问题\n2. 性能优化建议\n3. 代码风格和最佳实践\n4. 安全漏洞\n\n请提供具体的修改建议和代码示例。',
        category: '编程',
        tags: ['代码审查', '编程']
      },
      {
        icon: ' ',
        title: 'AI 绘图提示词优化',
        description: '优化 AI 图像生成的提示词',
        content: '请将以下简单想法转化为详细的 AI 绘图提示词，包括：主体描述、艺术风格、光影效果、构图方式、色彩方案、整体氛围、以及技术细节如镜头角度和分辨率。',
        category: '创意',
        tags: ['AI 绘图', 'Midjourney', 'DALL-E']
      },
      {
        icon: '  ',
        title: '邮件润色',
        description: '优化邮件内容，使其更专业得体',
        content: '请将以下邮件改写得更专业、清晰、简洁。保持原始信息和意图不变，同时改善语气和结构。',
        category: '商务',
        tags: ['邮件', '商务', '职场']
      }
    ];

    for (const prompt of defaults) {
      await this.addPrompt(prompt);
    }
  }
};
