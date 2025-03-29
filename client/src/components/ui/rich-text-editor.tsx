import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Bold, Italic, Underline, Strikethrough, 
  Heading1, Heading2, List, ListOrdered, 
  Link, Image, Table, Code, 
  Sparkles 
} from "lucide-react";

export interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  className?: string;
  id?: string;
  minHeight?: number;
}

export interface RichTextEditorRef {
  getContent: () => string;
  setContent: (html: string) => void;
  insertText: (text: string) => void;
  clear: () => void;
  focus: () => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  initialContent = '',
  placeholder = 'Start typing your content here...',
  onChange,
  className = '',
  id,
  minHeight = 280,
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Initialize editor with content if provided
  React.useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);
  
  // Handle changes in the editor
  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getContent: () => editorRef.current?.innerHTML || '',
    setContent: (html: string) => {
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
      }
    },
    insertText: (text: string) => {
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          editorRef.current.innerHTML += text;
        }
        handleInput();
      }
    },
    clear: () => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        handleInput();
      }
    },
    focus: () => {
      editorRef.current?.focus();
    }
  }));
  
  // Execute format command
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value || '');
    editorRef.current?.focus();
    handleInput();
  };
  
  // Handle special commands that require interaction
  const handleSpecialCommand = (command: string) => {
    switch (command) {
      case 'createLink': {
        const url = prompt('Enter URL:');
        if (url) execCommand('createLink', url);
        break;
      }
      case 'insertImage': {
        const url = prompt('Enter image URL:');
        if (url) execCommand('insertImage', url);
        break;
      }
      case 'insertTable': {
        const rows = prompt('Enter number of rows:', '3');
        const cols = prompt('Enter number of columns:', '3');
        if (rows && cols) {
          let tableHtml = '<table border="1" style="width:100%; border-collapse: collapse;">';
          for (let i = 0; i < parseInt(rows); i++) {
            tableHtml += '<tr>';
            for (let j = 0; j < parseInt(cols); j++) {
              tableHtml += '<td style="padding: 8px;">Cell</td>';
            }
            tableHtml += '</tr>';
          }
          tableHtml += '</table>';
          
          // Insert the table at cursor position
          document.execCommand('insertHTML', false, tableHtml);
        }
        break;
      }
      case 'insertMath': {
        const formula = prompt('Enter mathematical formula:');
        if (formula) {
          const mathSpan = `<span class="math-formula" style="font-family: monospace; background-color: #f9f9f9; padding: 2px 4px; border-radius: 2px;">\\(${formula}\\)</span>`;
          document.execCommand('insertHTML', false, mathSpan);
        }
        break;
      }
      default:
        break;
    }
    handleInput();
  };
  
  // Define toolbar button types
  interface BaseToolbarItem {
    type?: string;
  }
  
  interface SeparatorItem extends BaseToolbarItem {
    type: 'separator';
  }
  
  interface ButtonItem extends BaseToolbarItem {
    icon: React.ReactNode;
    command: string;
    title: string;
    value?: string;
    special?: boolean;
  }
  
  type ToolbarButton = ButtonItem | SeparatorItem;

  // Standard toolbar buttons
  const toolbarButtons: ToolbarButton[] = [
    { icon: <Bold size={18} />, command: 'bold', title: 'Bold' },
    { icon: <Italic size={18} />, command: 'italic', title: 'Italic' },
    { icon: <Underline size={18} />, command: 'underline', title: 'Underline' },
    { icon: <Strikethrough size={18} />, command: 'strikeThrough', title: 'Strikethrough' },
    { type: 'separator' } as SeparatorItem,
    { icon: <Heading1 size={18} />, command: 'formatBlock', value: '<h1>', title: 'Heading 1' },
    { icon: <Heading2 size={18} />, command: 'formatBlock', value: '<h2>', title: 'Heading 2' },
    { icon: <List size={18} />, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: <ListOrdered size={18} />, command: 'insertOrderedList', title: 'Numbered List' },
    { type: 'separator' } as SeparatorItem,
    { icon: <Link size={18} />, command: 'createLink', title: 'Insert Link', special: true },
    { icon: <Image size={18} />, command: 'insertImage', title: 'Insert Image', special: true },
    { icon: <Table size={18} />, command: 'insertTable', title: 'Insert Table', special: true },
    { icon: <Code size={18} />, command: 'insertMath', title: 'Insert Math Formula', special: true },
  ];
  
  return (
    <div 
      className={`border rounded-lg overflow-hidden bg-white ${className}`}
      style={{ minHeight }}
    >
      <div className="border-b bg-slate-50 p-2 flex flex-wrap gap-1">
        {toolbarButtons.map((btn, index) => 
          btn.type === 'separator' ? (
            <Separator key={`sep-${index}`} orientation="vertical" className="h-6 mx-1" />
          ) : (
            (() => {
              const buttonItem = btn as ButtonItem;
              return (
                <Button
                  key={buttonItem.command}
                  variant="ghost"
                  size="sm"
                  title={buttonItem.title}
                  onClick={() => buttonItem.special 
                    ? handleSpecialCommand(buttonItem.command) 
                    : execCommand(buttonItem.command, buttonItem.value)
                  }
                  className="px-2 h-8"
                  type="button"
                >
                  {buttonItem.icon}
                </Button>
              );
            })()
          )
        )}
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          title="Get AI Suggestions"
          className="px-2 h-8 flex items-center gap-1"
          type="button"
          onClick={() => alert('AI Assist will be available here')}
        >
          <Sparkles size={18} className="text-primary" />
          <span className="text-xs">AI Assist</span>
        </Button>
      </div>
      <div
        ref={editorRef}
        id={id}
        contentEditable
        className="p-4 min-h-[220px] focus:outline-none overflow-auto"
        onInput={handleInput}
        style={{ minHeight: 'calc(100% - 48px)' }}
        data-placeholder={placeholder}
      />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
