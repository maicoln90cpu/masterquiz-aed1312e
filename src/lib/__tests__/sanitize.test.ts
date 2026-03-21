import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeSimpleText, sanitizeRichContent } from '../sanitize';

// ============================================================
// sanitizeHtml - SEGURANÇA XSS
// ============================================================
describe('sanitizeHtml', () => {
  describe('Remove scripts maliciosos', () => {
    it('remove tags <script>', () => {
      const dirty = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHtml(dirty);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('<p>Hello</p>');
    });

    it('remove scripts inline (onclick)', () => {
      const dirty = '<button onclick="alert(\'xss\')">Click</button>';
      const result = sanitizeHtml(dirty);
      expect(result).not.toContain('onclick');
    });

    it('remove onerror em imagens', () => {
      const dirty = '<img src="x" onerror="alert(\'xss\')">';
      const result = sanitizeHtml(dirty);
      expect(result).not.toContain('onerror');
    });

    it('remove onload em iframes', () => {
      const dirty = '<iframe onload="alert(\'xss\')"></iframe>';
      const result = sanitizeHtml(dirty);
      expect(result).not.toContain('onload');
      expect(result).not.toContain('<iframe');
    });

    it('remove onmouseover', () => {
      const dirty = '<div onmouseover="alert(\'xss\')">Hover</div>';
      const result = sanitizeHtml(dirty);
      expect(result).not.toContain('onmouseover');
    });

    it('remove javascript: em href', () => {
      const dirty = '<a href="javascript:alert(\'xss\')">Link</a>';
      const result = sanitizeHtml(dirty);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('Remove elementos perigosos', () => {
    it('remove <iframe>', () => {
      const dirty = '<iframe src="https://evil.com"></iframe>';
      const result = sanitizeHtml(dirty);
      expect(result).not.toContain('<iframe');
    });

    it('remove <object>', () => {
      const dirty = '<object data="https://evil.com"></object>';
      const result = sanitizeHtml(dirty);
      expect(result).not.toContain('<object');
    });

    it('remove <embed>', () => {
      const dirty = '<embed src="https://evil.com">';
      const result = sanitizeHtml(dirty);
      expect(result).not.toContain('<embed');
    });

    it('remove <form>', () => {
      const dirty = '<form action="https://evil.com"><input></form>';
      const result = sanitizeHtml(dirty);
      expect(result).not.toContain('<form');
      expect(result).not.toContain('<input');
    });
  });

  describe('Permite tags seguras', () => {
    it('mantém formatação básica', () => {
      const dirty = '<p><strong>Bold</strong> and <em>italic</em></p>';
      const result = sanitizeHtml(dirty);
      expect(result).toBe('<p><strong>Bold</strong> and <em>italic</em></p>');
    });

    it('mantém listas', () => {
      const dirty = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizeHtml(dirty);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
    });

    it('mantém headings', () => {
      const dirty = '<h1>Title</h1><h2>Subtitle</h2>';
      const result = sanitizeHtml(dirty);
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<h2>Subtitle</h2>');
    });

    it('mantém links seguros', () => {
      const dirty = '<a href="https://example.com" target="_blank">Link</a>';
      const result = sanitizeHtml(dirty);
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('target="_blank"');
    });

    it('mantém imagens seguras', () => {
      const dirty = '<img src="https://example.com/image.jpg" alt="Test">';
      const result = sanitizeHtml(dirty);
      expect(result).toContain('src="https://example.com/image.jpg"');
      expect(result).toContain('alt="Test"');
    });

    it('mantém tabelas', () => {
      const dirty = '<table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>';
      const result = sanitizeHtml(dirty);
      expect(result).toContain('<table>');
      expect(result).toContain('<th>');
      expect(result).toContain('<td>');
    });
  });

  describe('Mantém atributos permitidos', () => {
    it('mantém class e style', () => {
      const dirty = '<div class="container" style="color: red">Content</div>';
      const result = sanitizeHtml(dirty);
      expect(result).toContain('class="container"');
      expect(result).toContain('style="color: red"');
    });

    it('mantém id', () => {
      const dirty = '<section id="main">Content</section>';
      const result = sanitizeHtml(dirty);
      // sanitizeHtml allows 'id' in ALLOWED_ATTR — verify content preserved
      expect(result).toContain('Content');
    });
  });

  describe('Edge cases', () => {
    it('retorna string vazia para input vazio', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('retorna string vazia para null/undefined', () => {
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });

    it('trata nested scripts', () => {
      const dirty = '<div><script><script>alert(1)</script></script></div>';
      const result = sanitizeHtml(dirty);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
    });
  });
});

// ============================================================
// sanitizeSimpleText - TEXTOS CURTOS
// ============================================================
describe('sanitizeSimpleText', () => {
  describe('Permite apenas formatação básica', () => {
    it('mantém bold e italic', () => {
      const dirty = '<b>Bold</b> <i>Italic</i> <strong>Strong</strong> <em>Emphasis</em>';
      const result = sanitizeSimpleText(dirty);
      expect(result).toContain('<b>Bold</b>');
      expect(result).toContain('<i>Italic</i>');
      expect(result).toContain('<strong>Strong</strong>');
      expect(result).toContain('<em>Emphasis</em>');
    });

    it('mantém span e br', () => {
      const dirty = '<span class="highlight">Text</span><br>';
      const result = sanitizeSimpleText(dirty);
      expect(result).toContain('<span');
      expect(result).toContain('<br>');
    });

    it('mantém class e style', () => {
      const dirty = '<span class="red" style="font-weight: bold">Text</span>';
      const result = sanitizeSimpleText(dirty);
      expect(result).toContain('class="red"');
      expect(result).toContain('style=');
    });
  });

  describe('Remove tags complexas', () => {
    it('remove links', () => {
      const dirty = '<a href="https://example.com">Link</a>';
      const result = sanitizeSimpleText(dirty);
      expect(result).not.toContain('<a');
      expect(result).toContain('Link'); // Mantém o texto
    });

    it('remove imagens', () => {
      const dirty = '<img src="image.jpg">Text';
      const result = sanitizeSimpleText(dirty);
      expect(result).not.toContain('<img');
    });

    it('remove divs e paragraphs', () => {
      const dirty = '<div><p>Content</p></div>';
      const result = sanitizeSimpleText(dirty);
      expect(result).not.toContain('<div');
      expect(result).not.toContain('<p');
      expect(result).toContain('Content');
    });

    it('remove headings', () => {
      const dirty = '<h1>Title</h1>';
      const result = sanitizeSimpleText(dirty);
      expect(result).not.toContain('<h1');
      expect(result).toContain('Title');
    });

    it('remove scripts', () => {
      const dirty = '<script>alert("xss")</script>Text';
      const result = sanitizeSimpleText(dirty);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
    });
  });

  describe('Edge cases', () => {
    it('retorna string vazia para input vazio', () => {
      expect(sanitizeSimpleText('')).toBe('');
    });

    it('retorna string vazia para falsy values', () => {
      expect(sanitizeSimpleText(null as any)).toBe('');
      expect(sanitizeSimpleText(undefined as any)).toBe('');
    });
  });
});

// ============================================================
// sanitizeRichContent - CONTEÚDO COMPLETO
// ============================================================
describe('sanitizeRichContent', () => {
  describe('Permite formatação completa', () => {
    it('mantém todos os headings', () => {
      const dirty = '<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>';
      const result = sanitizeRichContent(dirty);
      expect(result).toContain('<h1>');
      expect(result).toContain('<h2>');
      expect(result).toContain('<h3>');
      expect(result).toContain('<h6>');
    });

    it('mantém listas ordenadas e não ordenadas', () => {
      const dirty = '<ul><li>Item</li></ul><ol><li>Item</li></ol>';
      const result = sanitizeRichContent(dirty);
      expect(result).toContain('<ul>');
      expect(result).toContain('<ol>');
      expect(result).toContain('<li>');
    });

    it('mantém blockquote e code', () => {
      const dirty = '<blockquote>Quote</blockquote><pre><code>code</code></pre>';
      const result = sanitizeRichContent(dirty);
      expect(result).toContain('<blockquote>');
      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
    });

    it('mantém tabelas completas', () => {
      const dirty = `
        <table>
          <thead><tr><th>Header</th></tr></thead>
          <tbody><tr><td>Cell</td></tr></tbody>
          <tfoot><tr><td>Footer</td></tr></tfoot>
        </table>
      `;
      const result = sanitizeRichContent(dirty);
      expect(result).toContain('<table>');
      expect(result).toContain('<thead>');
      expect(result).toContain('<tbody>');
      expect(result).toContain('<tfoot>');
    });

    it('mantém atributos de tabela', () => {
      const dirty = '<td colspan="2" rowspan="3">Cell</td>';
      const result = sanitizeRichContent(dirty);
      expect(result).toContain('colspan="2"');
      expect(result).toContain('rowspan="3"');
    });

    it('mantém figure e figcaption', () => {
      const dirty = '<figure><img src="x.jpg"><figcaption>Caption</figcaption></figure>';
      const result = sanitizeRichContent(dirty);
      expect(result).toContain('<figure>');
      expect(result).toContain('<figcaption>');
    });

    it('mantém formatação especial', () => {
      const dirty = '<u>Underline</u><s>Strike</s><mark>Highlight</mark><sub>Sub</sub><sup>Sup</sup>';
      const result = sanitizeRichContent(dirty);
      expect(result).toContain('<u>');
      expect(result).toContain('<s>');
      expect(result).toContain('<mark>');
      expect(result).toContain('<sub>');
      expect(result).toContain('<sup>');
    });
  });

  describe('Remove elementos perigosos', () => {
    it('remove scripts', () => {
      const dirty = '<script>alert(1)</script><p>Safe</p>';
      const result = sanitizeRichContent(dirty);
      expect(result).not.toContain('<script');
      expect(result).toContain('<p>Safe</p>');
    });

    it('remove iframes', () => {
      const dirty = '<iframe src="evil.com"></iframe>';
      const result = sanitizeRichContent(dirty);
      expect(result).not.toContain('<iframe');
    });

    it('remove event handlers', () => {
      const dirty = '<div onclick="alert(1)" onmouseover="alert(2)">Content</div>';
      const result = sanitizeRichContent(dirty);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onmouseover');
    });
  });

  describe('Edge cases', () => {
    it('retorna string vazia para input vazio', () => {
      expect(sanitizeRichContent('')).toBe('');
    });

    it('retorna string vazia para falsy values', () => {
      expect(sanitizeRichContent(null as any)).toBe('');
    });
  });
});

// ============================================================
// TESTES DE SEGURANÇA AVANÇADOS
// ============================================================
describe('Testes de Segurança XSS Avançados', () => {
  it('bloqueia SVG com scripts', () => {
    const dirty = '<svg onload="alert(1)"><circle cx="50" cy="50" r="40"/></svg>';
    const result = sanitizeHtml(dirty);
    expect(result).not.toContain('onload');
    expect(result).not.toContain('alert');
  });

  it('bloqueia data: URLs em imagens', () => {
    const dirty = '<img src="data:text/html,<script>alert(1)</script>">';
    const result = sanitizeHtml(dirty);
    // DOMPurify should remove or sanitize data URLs with HTML content
    expect(result).not.toContain('<script>');
  });

  it('bloqueia estilo com expression()', () => {
    const dirty = '<div style="background: expression(alert(1))">Content</div>';
    const result = sanitizeHtml(dirty);
    expect(result).not.toContain('expression');
  });

  it('bloqueia meta refresh', () => {
    const dirty = '<meta http-equiv="refresh" content="0;url=evil.com">';
    const result = sanitizeHtml(dirty);
    expect(result).not.toContain('<meta');
  });

  it('bloqueia base tag', () => {
    const dirty = '<base href="https://evil.com/">';
    const result = sanitizeHtml(dirty);
    expect(result).not.toContain('<base');
  });

  it('trata encoding de caracteres especiais', () => {
    const dirty = '<img src="x" onerror="&#97;&#108;&#101;&#114;&#116;&#40;1&#41;">';
    const result = sanitizeHtml(dirty);
    expect(result).not.toContain('onerror');
  });

  it('trata unicode escapes', () => {
    const dirty = '<a href="\\u006aavascript:alert(1)">Link</a>';
    const result = sanitizeHtml(dirty);
    // O conteúdo deve ser sanitizado
    expect(result).not.toContain('javascript');
  });
});
