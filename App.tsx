
import React, { useState, useEffect } from 'react';
import { AppTab, GenerationRecord, BatchItem } from './types';
import Layout from './components/Layout';
import ImagePicker from './components/ImagePicker';
import { enhanceProductImage, generateModel, virtualTryOn } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.PRODUCT_STUDIO);
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Product Studio
  const [productSource, setProductSource] = useState<string | null>(null);
  const [productResult, setProductResult] = useState<string | null>(null);
  const [productPrompt, setProductPrompt] = useState('Minimalist high-end white studio setting, soft shadows.');

  // Model Studio
  const [modelPrompt, setModelPrompt] = useState('A professional female model, minimalist studio background, high fashion vibe.');
  const [modelResult, setModelResult] = useState<string | null>(null);
  const [modelMode, setModelMode] = useState<'generate' | 'upload'>('generate');

  // Try-On
  const [tryOnModel, setTryOnModel] = useState<string | null>(null);
  const [tryOnProduct, setTryOnProduct] = useState<string | null>(null);
  const [tryOnResults, setTryOnResults] = useState<string[]>([]);
  const [tryOnCustomPrompt, setTryOnCustomPrompt] = useState('Casual urban style, high fashion editorial look.');
  const [variationCount, setVariationCount] = useState<number>(1);

  // Batch (Sequence Mode)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ecom_studio_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const addToHistory = (url: string, type: GenerationRecord['type']) => {
    const newRecord: GenerationRecord = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      url,
      timestamp: Date.now()
    };
    setHistory(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('ecom_studio_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleProcessProduct = async () => {
    if (!productSource) return;
    setIsGenerating(true);
    try {
      const result = await enhanceProductImage(productSource.split(',')[1], productPrompt);
      setProductResult(result);
      addToHistory(result, 'product');
    } catch (error) {
      alert('Product processing failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateModel = async () => {
    setIsGenerating(true);
    try {
      const result = await generateModel(modelPrompt);
      setModelResult(result);
      addToHistory(result, 'model');
    } catch (error) {
      alert('Model generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTryOn = async () => {
    if (!tryOnModel || !tryOnProduct) return;
    setIsGenerating(true);
    setTryOnResults([]);
    try {
      const poses = [
        "Full body front view, hands on hips",
        "Slight side angle view, looking at camera",
        "Seated pose, professional fashion look",
        "Dynamic walking pose, natural motion"
      ];
      
      const newResults: string[] = [];
      for (let i = 0; i < variationCount; i++) {
        const result = await virtualTryOn(tryOnProduct, tryOnModel, tryOnCustomPrompt, poses[i]);
        newResults.push(result);
        addToHistory(result, 'try-on');
      }
      setTryOnResults(newResults);
    } catch (error) {
      alert('Try-on failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchUpload = (base64s: string[]) => {
    const newItems: BatchItem[] = base64s.map((b, i) => ({
      id: `${Date.now()}-${i}`,
      file: b,
      name: `Product ${i + 1}`,
      status: 'pending'
    }));
    setBatchItems(prev => [...prev, ...newItems]);
  };

  const runBatchProcess = async () => {
    if (!tryOnModel) {
      alert("Please select or generate a model first!");
      setActiveTab(AppTab.MODEL_STUDIO);
      return;
    }
    setIsBatchRunning(true);
    const items = [...batchItems];
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'done') continue;
      items[i].status = 'processing';
      setBatchItems([...items]);
      try {
        const studioUrl = await enhanceProductImage(items[i].file.split(',')[1], productPrompt);
        items[i].studioUrl = studioUrl;
        const tryOnUrl = await virtualTryOn(studioUrl, tryOnModel, tryOnCustomPrompt, `Pose variation ${i % 4}`);
        items[i].tryOnUrl = tryOnUrl;
        items[i].status = 'done';
        addToHistory(studioUrl, 'product');
        addToHistory(tryOnUrl, 'try-on');
      } catch (e) {
        items[i].status = 'error';
      }
      setBatchItems([...items]);
    }
    setIsBatchRunning(false);
  };

  const sendToTryOn = (url: string, type: 'product' | 'model') => {
    if (type === 'product') setTryOnProduct(url);
    else setTryOnModel(url);
    setActiveTab(AppTab.TRY_ON);
  };

  const renderProductStudio = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-4">Product Enhancement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ImagePicker label="1. Drag & Drop Product Photo" onImageSelected={setProductSource} preview={productSource} />
          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">2. Environment Prompt</label>
              <textarea 
                value={productPrompt} onChange={(e) => setProductPrompt(e.target.value)}
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                placeholder="e.g. Minimalist white studio..."
              />
            </div>
            <button
              onClick={handleProcessProduct} disabled={!productSource || isGenerating}
              className="mt-4 w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
            >
              {isGenerating ? 'Processing...' : '✨ Transform to Studio Ready'}
            </button>
          </div>
        </div>
      </div>
      {productResult && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 animate-slideUp">
          <div className="flex-1 aspect-square bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center">
            <img src={productResult} className="max-w-full max-h-full object-contain" />
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <button onClick={() => sendToTryOn(productResult, 'product')} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">👗 Send to Try-On Studio</button>
            <button onClick={() => { setBatchItems([{ id: 'quick', file: productSource!, name: 'Quick Item', status: 'pending' }]); setActiveTab(AppTab.BATCH_STUDIO); }} className="w-full py-4 border-2 border-slate-200 rounded-xl font-bold hover:bg-slate-50">⚡ Start Sequence</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderModelStudio = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-4">Model Studio</h2>
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
          <button onClick={() => setModelMode('generate')} className={`px-4 py-2 rounded-lg text-sm font-medium ${modelMode === 'generate' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>AI Generate</button>
          <button onClick={() => setModelMode('upload')} className={`px-4 py-2 rounded-lg text-sm font-medium ${modelMode === 'upload' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Upload Own</button>
        </div>
        {modelMode === 'generate' ? (
          <div className="flex gap-2 mb-8">
            <input type="text" value={modelPrompt} onChange={(e) => setModelPrompt(e.target.value)} className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Describe the model..." />
            <button onClick={handleGenerateModel} disabled={isGenerating} className="bg-indigo-600 text-white px-8 rounded-xl font-bold">Generate</button>
          </div>
        ) : (
          <ImagePicker label="Drop your own model's photo" onImageSelected={setModelResult} preview={modelResult && modelMode === 'upload' ? modelResult : null} />
        )}
        {modelResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-slideUp">
            <img src={modelResult} className="w-full aspect-[3/4] object-cover rounded-2xl border" />
            <div className="space-y-4">
              <div className="p-6 bg-indigo-50 rounded-2xl">
                <p className="text-indigo-800 text-sm">Model locked. Ready for consistent multi-pose generation.</p>
              </div>
              <button onClick={() => sendToTryOn(modelResult, 'model')} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">👗 Set Active Model</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderTryOn = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-8">Virtual Try-On Studio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Model Selection</h3>
            {tryOnModel ? (
              <div className="relative group rounded-2xl overflow-hidden border">
                <img src={tryOnModel} className="w-full aspect-[3/4] object-cover" />
                <button onClick={() => setTryOnModel(null)} className="absolute top-2 right-2 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </div>
            ) : (
              <button onClick={() => setActiveTab(AppTab.MODEL_STUDIO)} className="w-full aspect-[3/4] border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-400 transition-colors">Select Model</button>
            )}
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Product Asset</h3>
            {tryOnProduct ? (
              <div className="relative group rounded-2xl overflow-hidden border bg-slate-50">
                <img src={tryOnProduct} className="w-full aspect-[3/4] object-contain" />
                <button onClick={() => setTryOnProduct(null)} className="absolute top-2 right-2 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </div>
            ) : (
              <button onClick={() => setActiveTab(AppTab.PRODUCT_STUDIO)} className="w-full aspect-[3/4] border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-400 transition-colors">Select Product</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 rounded-3xl border border-slate-200">
           <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Styling & Direction</label>
              <textarea 
                value={tryOnCustomPrompt} 
                onChange={(e) => setTryOnCustomPrompt(e.target.value)}
                className="w-full h-32 p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                placeholder="Describe how the clothes should fit, look, or any specific styling cues..."
              />
           </div>
           <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Number of Poses</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(num => (
                  <button 
                    key={num} 
                    onClick={() => setVariationCount(num)}
                    className={`py-3 rounded-xl font-bold border-2 transition-all ${variationCount === num ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">Generating multiple poses provides a complete catalog experience with different angles and orientations.</p>
           </div>
        </div>

        <button 
          onClick={handleTryOn} 
          disabled={!tryOnModel || !tryOnProduct || isGenerating}
          className="mt-8 w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-bold text-lg shadow-xl disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center space-x-3"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin text-xl">✨</span>
              <span>Generating {variationCount} Variation{variationCount > 1 ? 's' : ''}...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Start Production</span>
            </>
          )}
        </button>
      </div>

      {tryOnResults.length > 0 && (
        <div className="space-y-6 animate-slideUp">
          <div className="flex justify-between items-end">
             <h2 className="text-xl font-bold">Production Results</h2>
             <span className="text-sm font-medium text-slate-500">{tryOnResults.length} Assets Generated</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tryOnResults.map((url, i) => (
              <div key={i} className="group relative bg-white p-2 rounded-2xl border shadow-sm transition-all hover:shadow-md">
                <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-slate-50">
                   <img src={url} className="w-full h-full object-cover" />
                </div>
                <div className="flex justify-between items-center p-1">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Pose {i + 1}</span>
                   <button onClick={() => window.open(url, '_blank')} className="text-indigo-600 text-xs font-bold">Download</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderBatchStudio = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Sequence Processing Mode</h2>
            <p className="text-sm text-slate-500">Fast-track your entire inventory with automated studio and try-on flows.</p>
          </div>
          <button 
            onClick={runBatchProcess}
            disabled={batchItems.length === 0 || isBatchRunning}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold disabled:bg-slate-300 shadow-lg"
          >
            {isBatchRunning ? 'Running Sequence...' : '⚡ Process All'}
          </button>
        </div>

        {batchItems.length === 0 ? (
          <ImagePicker multiple onImagesSelected={handleBatchUpload} label="Upload your raw product photos (up to 20)" className="h-64" />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Queue ({batchItems.length})</span>
              <button onClick={() => setBatchItems([])} className="text-red-500">Clear All</button>
            </div>
            <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {batchItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <div className="w-20 h-20 bg-white rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                    <img src={item.file} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.name}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        item.status === 'done' ? 'bg-green-100 text-green-700' : 
                        item.status === 'processing' ? 'bg-indigo-100 text-indigo-700 animate-pulse' :
                        item.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {item.status}
                      </div>
                      {item.status === 'done' && <span className="text-[10px] text-slate-400">Assets synced to Gallery</span>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {item.studioUrl && (
                       <div className="w-16 h-16 rounded-lg overflow-hidden border bg-white"><img src={item.studioUrl} className="w-full h-full object-contain" /></div>
                    )}
                    {item.tryOnUrl && (
                       <div className="w-16 h-16 rounded-lg overflow-hidden border bg-white"><img src={item.tryOnUrl} className="w-full h-full object-cover" /></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderGallery = () => (
    <div className="space-y-8 animate-fadeIn">
       <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Asset Gallery</h2>
          <span className="text-sm font-medium text-slate-500">{history.length} Total Generations</span>
       </div>
       
       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {history.map(record => (
            <div key={record.id} className="group relative aspect-[3/4] bg-white p-1 rounded-2xl border shadow-sm transition-all hover:shadow-md">
               <img src={record.url} className="w-full h-full object-cover rounded-xl" />
               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center space-y-2 rounded-2xl">
                  <div className="text-[10px] font-bold text-white uppercase bg-indigo-600 px-2 py-0.5 rounded-full mb-2">{record.type}</div>
                  <button onClick={() => window.open(record.url, '_blank')} className="px-3 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold">View</button>
                  <button onClick={() => sendToTryOn(record.url, record.type === 'product' ? 'product' : 'model')} className="px-3 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold">Use in Studio</button>
               </div>
            </div>
          ))}
          {history.length === 0 && (
             <div className="col-span-full py-32 text-center text-slate-400">
                <span className="text-5xl mb-4 block">📸</span>
                <p className="font-medium">No assets yet. Get started in the Product or Model Studio.</p>
             </div>
          )}
       </div>
    </div>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === AppTab.PRODUCT_STUDIO && renderProductStudio()}
      {activeTab === AppTab.MODEL_STUDIO && renderModelStudio()}
      {activeTab === AppTab.TRY_ON && renderTryOn()}
      {activeTab === AppTab.BATCH_STUDIO && renderBatchStudio()}
      {activeTab === AppTab.GALLERY && renderGallery()}
    </Layout>
  );
};

export default App;
