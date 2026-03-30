import { useMemo, useEffect } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

// Register custom fonts in Quill
const Font = Quill.import('formats/font') as any;
Font.whitelist = ['inter', 'roboto', 'open-sans', 'poppins', 'montserrat', 'lato'];
Quill.register(Font, true);

// Register size whitelist
const Size = Quill.import('formats/size') as any;
Size.whitelist = ['small', false, 'large', 'huge'];
Quill.register(Size, true);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  textColor?: string;
}

// Cores de texto disponíveis
const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#ffffff',
  '#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#00ffcc', '#0066ff', '#9900ff',
  '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff', '#ff00ff',
  '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#674ea7',
  '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#351c75',
];

// Cores de destaque (background) disponíveis
const HIGHLIGHT_COLORS = [
  '#ffffff', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#0000ff', '#ff0000',
  '#ffd700', '#90ee90', '#add8e6', '#ffb6c1', '#dda0dd', '#f0e68c', '#98fb98',
  '#ffefd5', '#e6e6fa', '#ffe4e1', '#f5f5dc', '#fafad2', '#e0ffff', '#fff0f5',
];

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Digite aqui...",
  minHeight = "150px",
  textColor,
}: RichTextEditorProps) => {
  const modules = useMemo(() => ({
    toolbar: [
      [{ font: ['', 'inter', 'roboto', 'open-sans', 'poppins', 'montserrat', 'lato'] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: TEXT_COLORS }, { background: HIGHLIGHT_COLORS }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link"],
      ["clean"],
    ],
  }), []);

  const formats = [
    "font",
    "size",
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "align",
    "link",
  ];

  return (
    <div className="rich-text-editor" style={{ minHeight }}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-background"
      />
      <style>{`
        .rich-text-editor .ql-toolbar {
          border-color: hsl(var(--border));
          border-radius: 0.5rem 0.5rem 0 0;
          background: hsl(var(--muted));
        }
        .rich-text-editor .ql-container {
          border-color: hsl(var(--border));
          border-radius: 0 0 0.5rem 0.5rem;
          font-size: 1rem;
        }
        .rich-text-editor .ql-editor {
          min-height: ${minHeight};
          color: ${textColor || 'hsl(var(--foreground))'};
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: ${textColor || 'hsl(var(--muted-foreground))'};
        }
        .rich-text-editor .ql-picker-label,
        .rich-text-editor .ql-picker-item {
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        .rich-text-editor .ql-fill {
          fill: hsl(var(--foreground));
        }
        .rich-text-editor .ql-picker-options {
          background: hsl(var(--popover));
          border-color: hsl(var(--border));
        }
        .rich-text-editor .ql-color-picker .ql-picker-options,
        .rich-text-editor .ql-background .ql-picker-options {
          width: 196px;
          padding: 4px;
        }
        .rich-text-editor .ql-color-picker .ql-picker-item,
        .rich-text-editor .ql-background .ql-picker-item {
          width: 20px;
          height: 20px;
          border-radius: 3px;
          margin: 2px;
        }
        
        /* MOBILE: Toolbar compacta em 2 linhas - sem flex no toolbar principal */
        @media (max-width: 768px) {
          .rich-text-editor .ql-toolbar {
            padding: 6px 8px !important;
          }
          .rich-text-editor .ql-toolbar .ql-formats {
            margin-right: 6px !important;
            margin-bottom: 4px !important;
          }
          .rich-text-editor .ql-toolbar button {
            width: 26px !important;
            height: 26px !important;
            padding: 3px !important;
          }
          .rich-text-editor .ql-toolbar .ql-picker {
            height: 26px !important;
          }
          .rich-text-editor .ql-toolbar .ql-picker-label {
            padding: 0 4px !important;
            border: 1px solid hsl(var(--border)) !important;
            border-radius: 4px !important;
          }
          .rich-text-editor .ql-header.ql-picker {
            width: 70px !important;
          }
          .rich-text-editor .ql-toolbar svg {
            width: 16px !important;
            height: 16px !important;
          }
          .rich-text-editor .ql-editor {
            min-height: 80px;
            font-size: 14px;
            padding: 8px;
          }
          .rich-text-editor .ql-container {
            font-size: 14px;
          }
          .rich-text-editor .ql-picker.ql-font {
            width: 90px !important;
          }
          .rich-text-editor .ql-picker.ql-size {
            width: 70px !important;
          }
        }
      `}</style>
    </div>
  );
};
