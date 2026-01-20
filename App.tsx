
import React, { useState, useEffect } from 'react';
import { AppTab, GenerationRecord } from './types';
import Layout from './components/Layout';
import ImagePicker from './components/ImagePicker';
import { enhanceProductImage, generateModel, virtualTryOn } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.PRODUCT_STUDIO);
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Product Studio States ---
  const [productSource, setProductSource] = useState<string | null>(null);
  const [productResult, setProductResult] = useState<string | null>(null);
  const [productPrompt, setProductPrompt] = useState('Minimalist high-end white studio setting, soft shadows.');

  // --- Model Studio States ---
  const [modelMode, setModelMode] = useState<'generate' | 'upload'>('generate');
  const [modelPrompt, setModelPrompt] = useState('A professional female model, minimalist studio background, high fashion vibe.');
  const [modelResult, setModelResult] = useState<string | null>(null);

  // --- Virtual Try-On States ---
  const [tryOnModel, setTryOnModel] = useState<string | null>(null);
  const [tryOnProduct, setTryOnProduct] = useState<string | null>(null);
  const [tryOnResults, setTryOnResults] = useState<string[]>([]);
  const [tryOnCustomPrompt, setTryOnCustomPrompt] = useState('Casual urban style, high fashion editorial look. Ensure the fabric texture and drape is realistic.');
  const [variationCount, setVariationCount] = useState<number>(1);

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
      alert('Product enhancement failed. Please try again.');
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
      alert('Model generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTryOn = async () => {
    if (!tryOnModel || !tryOnProduct) return;
    setIsGenerating(true);
    setTryOnResults([]);
    try {
      const posePrompts = [
        "Full body front view, hands relaxed.",
        "Slight side angle view, high fashion pose.",
        "Seated pose, showing garment details.",
        "Dynamic walking motion, looking away from camera."
      ];
      
      const newResults: string[] = [];
      // Generate variations in sequence to provide unique poses
      for (let i = 0; i < variationCount; i++) {
        const result = await virtualTryOn(tryOnProduct, tryOnModel, tryOnCustomPrompt, posePrompts[i]);
        newResults.push(result);
        addToHistory(result, 'try-on');
      }
      setTryOnResults(newResults);
    } catch (error) {
      alert('Try-on process failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendToTryOn = (url: string, type: 'product' | 'model') => {
    if (type === 'product') setTryOnProduct(url);
    else setTryOnModel(url);
    setActiveTab(AppTab.TRY_ON);
  };

  const renderProductStudio = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <span className="mr-2">📸</span> Product Background & Lighting
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ImagePicker label="1. Upload Original Product" onImageSelected={setProductSource} preview={productSource} />
          <div className="flex flex-col">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">2. Studio Environment</label>
            <textarea 
              value={productPrompt} onChange={(e) => setProductPrompt(e.target.value)}
              className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm resize-none mb-4 min-h-[150px]"
              placeholder="e.g. Elegant marble surface, warm morning sun lighting, blurry luxury interior background..."
            />
            <button
              onClick={handleProcessProduct} disabled={!productSource || isGenerating}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-all flex items-center justify-center space-x-2"
            >
              {isGenerating ? <span className="animate-spin text-xl">✨</span> : <span>✨</span>}
              <span>{isGenerating ? 'Enhancing...' : 'Transform to Studio Ready'}</span>
            </button>
          </div>
        </div>
      </div>
      {productResult && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 animate-slideUp">
          <div className="flex-1 aspect-square bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border">
            <img src={productResult} className="max-w-full max-h-full object-contain" alt="Enhanced Product" />
          </div>
          <div className="flex flex-col justify-center space-y-4 md:w-64">
            <p className="text-sm text-slate-500 font-medium">Background removed and lighting adjusted to professional studio standards.</p>
            <button onClick={() => sendToTryOn(productResult, 'product')} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md">👗 Send to Try-On Studio</button>
            <button onClick={() => window.open(productResult, '_blank')} className="w-full py-4 border-2 border-slate-200 rounded-xl font-bold hover:bg-slate-50 text-slate-600">Download Asset</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderModelStudio = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">👤</span> Model Asset Management
        </h2>
        <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-2xl mb-8 w-fit">
          <button onClick={() => setModelMode('generate')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${modelMode === 'generate' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>AI Generate Model</button>
          <button onClick={() => setModelMode('upload')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${modelMode === 'upload' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Upload Your Own</button>
        </div>
        
        {modelMode === 'generate' ? (
          <div className="space-y-4 mb-8">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Model Description</label>
            <div className="flex flex-col md:flex-row gap-2">
              <input type="text" value={modelPrompt} onChange={(e) => setModelPrompt(e.target.value)} className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Diversity model, standing in sunlight, Tokyo street vibe..." />
              <button onClick={handleGenerateModel} disabled={isGenerating} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:bg-slate-300">
                {isGenerating ? 'Generating...' : 'Generate AI Model'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <ImagePicker label="Drop your favorite model photo" onImageSelected={setModelResult} preview={modelResult && modelMode === 'upload' ? modelResult : null} />
          </div>
        )}

        {modelResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-slideUp">
            <div className="rounded-2xl overflow-hidden border shadow-inner aspect-[3/4] bg-slate-50">
              <img src={modelResult} className="w-full h-full object-cover" alt="Model Asset" />
            </div>
            <div className="space-y-6">
              <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                <h4 className="text-indigo-900 font-bold mb-2">Model Asset Ready</h4>
                <p className="text-indigo-700/80 text-sm leading-relaxed">This model will be used as the base for virtual try-on sessions. You can generate multiple poses and angles using this model identity.</p>
              </div>
              <button onClick={() => sendToTryOn(modelResult, 'model')} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2">
                <span>👗</span>
                <span>Set as Active Studio Model</span>
              </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Side 1: Model */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Base Model</h3>
               {tryOnModel && <button onClick={() => setTryOnModel(null)} className="text-[10px] font-bold text-indigo-500 uppercase">Change</button>}
            </div>
            {tryOnModel ? (
              <div className="relative rounded-2xl overflow-hidden border shadow-inner">
                <img src={tryOnModel} className="w-full aspect-[3/4] object-cover" alt="Base Model" />
              </div>
            ) : (
              <button onClick={() => setActiveTab(AppTab.MODEL_STUDIO)} className="w-full aspect-[3/4] border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-indigo-400 transition-all flex flex-col items-center justify-center space-y-4 bg-slate-50">
                <span className="text-4xl">👤</span>
                <span className="font-bold text-sm">Select Studio Model</span>
              </button>
            )}
          </div>
          {/* Side 2: Product */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Garment Asset</h3>
               {tryOnProduct && <button onClick={() => setTryOnProduct(null)} className="text-[10px] font-bold text-indigo-500 uppercase">Change</button>}
            </div>
            {tryOnProduct ? (
              <div className="relative rounded-2xl overflow-hidden border bg-slate-50 shadow-inner">
                <img src={tryOnProduct} className="w-full aspect-[3/4] object-contain" alt="Product Asset" />
              </div>
            ) : (
              <button onClick={() => setActiveTab(AppTab.PRODUCT_STUDIO)} className="w-full aspect-[3/4] border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-indigo-400 transition-all flex flex-col items-center justify-center space-y-4 bg-slate-50">
                <span className="text-4xl">👕</span>
                <span className="font-bold text-sm">Select Product Asset</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-900 rounded-[32px] text-white">
           <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Production Styling</label>
              <textarea 
                value={tryOnCustomPrompt} 
                onChange={(e) => setTryOnCustomPrompt(e.target.value)}
                className="w-full h-32 p-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm resize-none text-white placeholder-slate-500"
                placeholder="Describe how the clothes should look, any specific fit details or accessories..."
              />
           </div>
           <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Multi-Pose Pack</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(num => (
                  <button 
                    key={num} 
                    onClick={() => setVariationCount(num)}
                    className={`py-4 rounded-xl font-bold border-2 transition-all ${variationCount === num ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-white/20 text-white/40 hover:border-white/40'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="mt-4 p-4 bg-white/5 rounded-xl text-xs text-white/60 leading-relaxed">
                 Generating multiple poses will create different camera angles and model orientations for a complete storefront experience.
              </div>
           </div>
        </div>

        <button 
          onClick={handleTryOn} 
          disabled={!tryOnModel || !tryOnProduct || isGenerating}
          className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-3xl font-bold text-xl shadow-2xl shadow-indigo-200 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center justify-center space-x-3"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin text-2xl">✨</span>
              <span>Developing {variationCount} Look{variationCount > 1 ? 's' : ''}...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Start Production Studio</span>
            </>
          )}
        </button>
      </div>

      {tryOnResults.length > 0 && (
        <div className="space-y-8 animate-slideUp">
          <div className="flex justify-between items-end">
             <h2 className="text-2xl font-bold">Production Assets</h2>
             <span className="text-sm font-semibold text-slate-500">{tryOnResults.length} Assets Generated</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tryOnResults.map((url, i) => (
              <div key={i} className="group relative bg-white p-2 rounded-3xl border shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100">
                   <img src={url} className="w-full h-full object-cover" alt={`Look ${i + 1}`} />
                </div>
                <div className="flex justify-between items-center p-4">
                   <div className="space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Angle {i + 1}</span>
                      <span className="block text-sm font-bold text-slate-700 tracking-tight">Studio Look</span>
                   </div>
                   <button onClick={() => window.open(url, '_blank')} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderGallery = () => (
    <div className="space-y-8 animate-fadeIn">
       <div className="flex items-end justify-between border-b border-slate-200 pb-6">
          <h2 className="text-3xl font-bold tracking-tight">Asset Gallery</h2>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{history.length} Generations</span>
       </div>
       
       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {history.map(record => (
            <div key={record.id} className="group relative aspect-[3/4] bg-white p-1.5 rounded-2xl border shadow-sm transition-all hover:shadow-md cursor-pointer">
               <img src={record.url} className="w-full h-full object-cover rounded-xl" alt="Gallery item" />
               <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center space-y-3 rounded-2xl">
                  <div className={`text-[10px] font-bold text-white uppercase px-3 py-1 rounded-full ${
                    record.type === 'product' ? 'bg-amber-500' : record.type === 'model' ? 'bg-indigo-500' : 'bg-emerald-500'
                  }`}>{record.type}</div>
                  <button onClick={() => window.open(record.url, '_blank')} className="w-24 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100">View Original</button>
                  <button onClick={() => sendToTryOn(record.url, record.type === 'product' ? 'product' : 'model')} className="w-24 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100">Use in Studio</button>
               </div>
            </div>
          ))}
          {history.length === 0 && (
             <div className="col-span-full py-40 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                   <span className="text-4xl">📭</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Your gallery is empty</h3>
                <p className="text-slate-500 mt-2 max-w-xs mx-auto">Start by enhancing your first product or generating a model in the studio.</p>
                <button onClick={() => setActiveTab(AppTab.PRODUCT_STUDIO)} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100">Go to Studio</button>
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
      {activeTab === AppTab.GALLERY && renderGallery()}
    </Layout>
  );
};

export default App;
