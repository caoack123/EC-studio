
import React, { useState, useEffect } from 'react';
import { AppTab, GenerationRecord, BatchItem } from './types';
import Layout from './components/Layout';
import ImagePicker from './components/ImagePicker';
import { enhanceProductImage, generateModel, virtualTryOn } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.PRODUCT_STUDIO);
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // States for Product Studio
  const [productSource, setProductSource] = useState<string | null>(null);
  const [productResult, setProductResult] = useState<string | null>(null);
  const [productPrompt, setProductPrompt] = useState('Minimalist high-end white studio setting, soft shadows.');

  // States for Model Studio
  const [modelPrompt, setModelPrompt] = useState('A professional female model, minimalist studio background, high fashion vibe.');
  const [modelResult, setModelResult] = useState<string | null>(null);
  const [modelMode, setModelMode] = useState<'generate' | 'upload'>('generate');

  // States for Try-On
  const [tryOnModel, setTryOnModel] = useState<string | null>(null);
  const [tryOnProduct, setTryOnProduct] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);

  // Batch States
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ecom_studio_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const addToHistory = (url: string, type: GenerationRecord['type']) => {
    const newRecord: GenerationRecord = {
      id: Date.now().toString(),
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
      const base64 = productSource.split(',')[1];
      const result = await enhanceProductImage(base64, productPrompt);
      setProductResult(result);
      addToHistory(result, 'product');
    } catch (error) {
      console.error(error);
      alert('Failed to process image');
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
      console.error(error);
      alert('Failed to generate model');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTryOn = async () => {
    if (!tryOnModel || !tryOnProduct) return;
    setIsGenerating(true);
    try {
      const result = await virtualTryOn(tryOnProduct, tryOnModel, false);
      setTryOnResult(result);
      addToHistory(result, 'try-on');
    } catch (error) {
      console.error(error);
      alert('Try-on failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendToTryOn = (url: string, type: 'product' | 'model') => {
    if (type === 'product') setTryOnProduct(url);
    else setTryOnModel(url);
    setActiveTab(AppTab.TRY_ON);
  };

  // Batch Logic
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
      alert("Please select or generate a model first in the Model Studio!");
      setActiveTab(AppTab.MODEL_STUDIO);
      return;
    }
    setIsBatchRunning(true);
    
    const items = [...batchItems];
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === 'done' || items[i].status === 'processing') continue;
      
      items[i].status = 'processing';
      setBatchItems([...items]);

      try {
        const studioUrl = await enhanceProductImage(items[i].file.split(',')[1], productPrompt);
        items[i].studioUrl = studioUrl;
        addToHistory(studioUrl, 'product');

        const tryOnUrl = await virtualTryOn(studioUrl, tryOnModel, true);
        items[i].tryOnUrl = tryOnUrl;
        items[i].status = 'done';
        addToHistory(tryOnUrl, 'try-on');
      } catch (e) {
        console.error(e);
        items[i].status = 'error';
      }
      setBatchItems([...items]);
    }
    setIsBatchRunning(false);
  };

  const renderProductStudio = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-4">Enhance Your Product</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ImagePicker label="1. Upload or Drop Product" onImageSelected={setProductSource} preview={productSource} />
          <div className="flex flex-col justify-between">
            <textarea 
              value={productPrompt} onChange={(e) => setProductPrompt(e.target.value)}
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm resize-none"
              placeholder="Describe studio setting..."
            />
            <button
              onClick={handleProcessProduct} disabled={!productSource || isGenerating}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
            >
              {isGenerating ? '✨ Refining...' : '✨ Transform to Studio Ready'}
            </button>
          </div>
        </div>
      </div>
      {productResult && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 animate-slideUp">
          <div className="flex-1 aspect-square bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center">
            <img src={productResult} className="max-w-full max-h-full object-contain" alt="Result" />
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <h3 className="text-lg font-bold">Studio Shot Created</h3>
            <button onClick={() => sendToTryOn(productResult, 'product')} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">👗 Send to Try-On Studio</button>
            <button onClick={() => { setBatchItems([{ id: Date.now().toString(), file: productSource!, name: 'Quick Batch', status: 'pending' }]); setActiveTab(AppTab.BATCH_STUDIO); }} className="w-full py-4 border-2 border-slate-200 rounded-xl font-bold hover:bg-slate-50">⚡ Start Sequence with this</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderModelStudio = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-4">Model Management</h2>
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
          <button onClick={() => setModelMode('generate')} className={`px-4 py-2 rounded-lg text-sm font-medium ${modelMode === 'generate' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>AI Generate</button>
          <button onClick={() => setModelMode('upload')} className={`px-4 py-2 rounded-lg text-sm font-medium ${modelMode === 'upload' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Upload Own</button>
        </div>
        {modelMode === 'generate' ? (
          <div className="flex gap-2 mb-8">
            <input type="text" value={modelPrompt} onChange={(e) => setModelPrompt(e.target.value)} className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl" />
            <button onClick={handleGenerateModel} disabled={isGenerating} className="bg-indigo-600 text-white px-8 rounded-xl font-bold">{isGenerating ? '...' : 'Generate'}</button>
          </div>
        ) : (
          <ImagePicker label="Drop your model's photo" onImageSelected={setModelResult} preview={modelResult && modelMode === 'upload' ? modelResult : null} />
        )}
        {modelResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-slideUp">
            <img src={modelResult} className="w-full aspect-[3/4] object-cover rounded-2xl border" alt="Model Result" />
            <div className="space-y-4">
              <div className="p-6 bg-indigo-50 rounded-2xl">
                <p className="text-indigo-800 text-sm">Model locked. Ready for consistent batch processing with natural variations.</p>
              </div>
              <button onClick={() => sendToTryOn(modelResult, 'model')} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">👗 Set as Active Studio Model</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderTryOn = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-4">Virtual Try-On Studio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700">1. Select Model</h3>
            {tryOnModel ? (
              <div className="relative group">
                <img src={tryOnModel} className="w-full aspect-[3/4] object-cover rounded-2xl border" alt="Try-on model" />
                <button onClick={() => setTryOnModel(null)} className="absolute top-2 right-2 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </div>
            ) : (
              <div onClick={() => setActiveTab(AppTab.MODEL_STUDIO)} className="w-full aspect-[3/4] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400">
                <span className="text-3xl mb-2">👤</span>
                <p className="text-sm text-slate-500">Pick or Generate a Model</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700">2. Select Product</h3>
            {tryOnProduct ? (
              <div className="relative group">
                <img src={tryOnProduct} className="w-full aspect-[3/4] object-contain rounded-2xl border bg-slate-50" alt="Try-on product" />
                <button onClick={() => setTryOnProduct(null)} className="absolute top-2 right-2 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </div>
            ) : (
              <div onClick={() => setActiveTab(AppTab.PRODUCT_STUDIO)} className="w-full aspect-[3/4] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400">
                <span className="text-3xl mb-2">📸</span>
                <p className="text-sm text-slate-500">Pick or Upload a Product</p>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={handleTryOn} 
          disabled={!tryOnModel || !tryOnProduct || isGenerating}
          className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
        >
          {isGenerating ? '✨ Fitting Product...' : '✨ Generate Virtual Try-On'}
        </button>
      </div>
      {tryOnResult && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-slideUp">
          <h2 className="text-xl font-bold mb-6">Final Result</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <img src={tryOnResult} className="w-full md:w-1/2 rounded-2xl border shadow-xl" alt="Try-on result" />
            <div className="flex-1 space-y-4">
              <div className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center">
                <span className="mr-2">✅</span> High resolution render complete
              </div>
              <p className="text-slate-600">The product has been naturally draped onto the model with consistent lighting and texture mapping.</p>
              <button onClick={() => window.open(tryOnResult!, '_blank')} className="w-full py-4 border-2 border-slate-200 rounded-xl font-bold hover:bg-slate-50">Download Assets</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBatchStudio = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Sequence Processing Mode</h2>
          <button 
            onClick={runBatchProcess} 
            disabled={batchItems.length === 0 || isBatchRunning}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-semibold disabled:bg-slate-300"
          >
            {isBatchRunning ? '⚡ Processing...' : '⚡ Run Studio Sequence'}
          </button>
        </div>
        <ImagePicker 
          multiple label="Add Multiple Products for Batch Processing" 
          onImagesSelected={handleBatchUpload} 
          onImageSelected={() => {}} 
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batchItems.map(item => (
            <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <img src={item.file} className="w-12 h-12 rounded object-cover" alt={item.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{item.name}</p>
                  <p className={`text-xs ${item.status === 'done' ? 'text-green-600' : item.status === 'error' ? 'text-red-600' : 'text-slate-500'}`}>
                    {item.status.toUpperCase()}
                  </p>
                </div>
              </div>
              {item.status === 'done' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="aspect-[3/4] bg-white rounded-lg border overflow-hidden">
                    <img src={item.studioUrl} className="w-full h-full object-contain" alt="Studio" />
                  </div>
                  <div className="aspect-[3/4] bg-white rounded-lg border overflow-hidden">
                    <img src={item.tryOnUrl} className="w-full h-full object-cover" alt="Try-on" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGallery = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {history.map(item => (
          <div key={item.id} className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm group">
            <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-slate-50">
              <img src={item.url} className="w-full h-full object-cover" alt="History item" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button onClick={() => window.open(item.url, '_blank')} className="p-2 bg-white rounded-full text-sm">👁️</button>
              </div>
            </div>
            <div className="mt-2 px-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.type}</p>
              <p className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400">
            <p className="text-4xl mb-4">📭</p>
            <p>No generations yet. Start in the Studio!</p>
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
