import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../store/AppContext';
import { X, Maximize, Minimize, Code2 } from 'lucide-react';
import { cn } from './Sidebar';

export default function PhonePreviewOverlay() {
  const { showPhonePreview, setShowPhonePreview } = useContext(AppContext);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [htmlCode, setHtmlCode] = useState('<div style="text-align: center; padding: 20px; font-family: sans-serif;">\n  <h1 style="color: blue;">Hello World!</h1>\n  <p>Live preview running on mobile frame.</p>\n  <button style="padding: 10px 20px; border-radius: 8px; border: none; background: #3b82f6; color: white;">Click Me</button>\n</div>');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('preview');

  // We debounce the srcDoc to avoid flickering when typing fast
  const [srcDoc, setSrcDoc] = useState(htmlCode);
  useEffect(() => {
    const timer = setTimeout(() => setSrcDoc(htmlCode), 500);
    return () => clearTimeout(timer);
  }, [htmlCode]);

  if (!showPhonePreview) return null;

  const phoneFrameStyles = isFullscreen 
    ? "fixed inset-0 z-[100] bg-white flex flex-col md:flex-row" 
    : "fixed bottom-24 left-6 z-[100] w-[350px] h-[700px] bg-white rounded-[40px] shadow-2xl border-[8px] border-gray-900 overflow-hidden flex flex-col transform transition-all";

  return (
    <>
      <div className={cn("fixed inset-0 bg-black/40 z-[90] transition-opacity", isFullscreen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={() => isFullscreen && setIsFullscreen(false)}></div>
      
      <div className={phoneFrameStyles}>
        {/* Notch area for normal mode */}
        {!isFullscreen && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-10"></div>
        )}

        {/* Toolbar */}
        <div className={cn("bg-gray-100 flex items-center justify-between p-2 pt-4 px-4 z-20 shadow-sm", isFullscreen ? "border-b" : "")}>
          <div className="flex gap-2">
            {!isFullscreen && (
              <>
                <button onClick={() => setActiveTab('preview')} className={cn("px-3 py-1 rounded-full text-sm font-medium", activeTab === 'preview' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700')}>Preview</button>
                <button onClick={() => setActiveTab('code')} className={cn("px-3 py-1 rounded-full text-sm font-medium", activeTab === 'code' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700')}><Code2 size={16}/></button>
              </>
            )}
          </div>
          <div className="flex gap-2 text-gray-600">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1 hover:bg-gray-200 rounded">
              {isFullscreen ? <Minimize size={18}/> : <Maximize size={18}/>}
            </button>
            <button onClick={() => setShowPhonePreview(false)} className="p-1 hover:bg-red-100 hover:text-red-500 rounded">
              <X size={18}/>
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className={cn("flex-1 overflow-hidden", isFullscreen ? "flex flex-col md:flex-row" : "flex flex-col")}>
          {/* Code Editor */}
          {(isFullscreen || activeTab === 'code') && (
            <div className={cn("bg-slate-900 flex flex-col", isFullscreen ? "flex-1 border-r border-slate-700" : "flex-1")}>
              {isFullscreen && <div className="bg-slate-800 text-slate-300 text-xs px-4 py-2 font-mono uppercase font-bold tracking-wider">HTML/CSS/JS Editor</div>}
              <textarea 
                value={htmlCode} 
                onChange={(e) => setHtmlCode(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full bg-transparent text-gray-100 p-4 font-mono text-sm resize-none focus:outline-none leading-relaxed"
                placeholder="<!-- Write your HTML here -->"
              ></textarea>
            </div>
          )}

          {/* Iframe Preview */}
          {(isFullscreen || activeTab === 'preview') && (
            <div className={cn("bg-white relative", isFullscreen ? "w-[375px] mx-auto border-x shadow-2xl h-[812px] my-auto rounded-[40px] border-8 border-gray-900 overflow-hidden" : "flex-1")}>
              {isFullscreen && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-10"></div>}
              <iframe 
                srcDoc={srcDoc}
                title="live-preview"
                sandbox="allow-scripts"
                className="w-full h-full border-none bg-white"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
