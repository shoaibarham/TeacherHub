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
          // Determine if the input is HTML or plain text
          const isHTML = /<[a-z][\s\S]*>/i.test(text);
          
          if (isHTML) {
            // Create a temporary div to hold our HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text;
            
            const range = selection.getRangeAt(0);
            
            // Insert each child node from our HTML
            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
              fragment.appendChild(tempDiv.firstChild);
            }
            
            range.deleteContents();
            range.insertNode(fragment);
            
            // Move the cursor to the end
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            // Just insert plain text
            const range = selection.getRangeAt(0);
            const textNode = document.createTextNode(text);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } else {
          // If no selection, append to the end
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
    id?: string; // Add unique ID field
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
    { id: 'btn-bold', icon: <Bold size={18} />, command: 'bold', title: 'Bold' },
    { id: 'btn-italic', icon: <Italic size={18} />, command: 'italic', title: 'Italic' },
    { id: 'btn-underline', icon: <Underline size={18} />, command: 'underline', title: 'Underline' },
    { id: 'btn-strike', icon: <Strikethrough size={18} />, command: 'strikeThrough', title: 'Strikethrough' },
    { id: 'sep-1', type: 'separator' } as SeparatorItem,
    { id: 'btn-h1', icon: <Heading1 size={18} />, command: 'formatBlock', value: '<h1>', title: 'Heading 1' },
    { id: 'btn-h2', icon: <Heading2 size={18} />, command: 'formatBlock', value: '<h2>', title: 'Heading 2' },
    { id: 'btn-ul', icon: <List size={18} />, command: 'insertUnorderedList', title: 'Bullet List' },
    { id: 'btn-ol', icon: <ListOrdered size={18} />, command: 'insertOrderedList', title: 'Numbered List' },
    { id: 'sep-2', type: 'separator' } as SeparatorItem,
    { id: 'btn-link', icon: <Link size={18} />, command: 'createLink', title: 'Insert Link', special: true },
    { id: 'btn-image', icon: <Image size={18} />, command: 'insertImage', title: 'Insert Image', special: true },
    { id: 'btn-table', icon: <Table size={18} />, command: 'insertTable', title: 'Insert Table', special: true },
    { id: 'btn-math', icon: <Code size={18} />, command: 'insertMath', title: 'Insert Math Formula', special: true },
  ];
  
  return (
    <div 
      className={`border rounded-lg overflow-hidden bg-white ${className}`}
      style={{ minHeight }}
    >
      <div className="border-b bg-slate-50 p-2 flex flex-wrap gap-1">
        {toolbarButtons.map((btn) => 
          btn.type === 'separator' ? (
            <Separator key={btn.id} orientation="vertical" className="h-6 mx-1" />
          ) : (
            (() => {
              const buttonItem = btn as ButtonItem;
              return (
                <Button
                  key={buttonItem.id}
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
        {/* Removed the AI assist button from the toolbar to avoid duplication */}
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
