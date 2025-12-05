
import React, { useState } from 'react';
import axios from 'axios';
import { 
  Upload, FileText, Search, ShieldCheck, 
  Cpu, Briefcase, ChevronRight, CheckCircle, 
  AlertTriangle, X, Loader2, Sparkles 
} from 'lucide-react';

// --- COMPONENTS ---

// 1. Header Component
const Header = () => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">ResumeAI<span className="text-blue-600">.Pro</span></h1>
          <p className="text-xs text-slate-500 font-medium">Privacy-First Intelligent Analysis</p>
        </div>
      </div>
      <div className="flex gap-4 text-sm font-medium text-slate-600">
        <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-green-600" /> PII Scrubbing Active</span>
        <span className="flex items-center gap-1"><Sparkles className="w-4 h-4 text-purple-600" /> Llama-3 Powered</span>
      </div>
    </div>
  </header>
);

// 2. File Upload Component
const FileUpload = ({ onUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ease-in-out
      ${dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:bg-slate-50"}`}
      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
    >
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])}
        accept=".pdf"
        disabled={isLoading}
      />
      
      <div className="flex flex-col items-center justify-center gap-4">
        {isLoading ? (
          <div className="animate-spin text-blue-600"><Loader2 size={48} /></div>
        ) : (
          <div className="bg-blue-100 p-4 rounded-full text-blue-600">
            <Upload size={32} />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-slate-700">
            {isLoading ? "Analyzing Resume..." : "Drop your Resume PDF here"}
          </h3>
          <p className="text-slate-500 mt-1 text-sm">
            {isLoading ? "Running Local ML Classification & LLM Gap Analysis" : "We scrub personal data before processing."}
          </p>
        </div>
      </div>
    </div>
  );
};

// 3. Results Dashboard
const AnalysisResults = ({ data }) => {
  if (!data) return null;

  const { classification, dynamic_analysis } = data;
  const confidence = parseFloat(classification.confidence_score);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Top Banner: Classification */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Predicted Role</span>
          <h2 className="text-3xl font-extrabold text-slate-800 mt-1">{classification.predicted_category}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md font-medium border border-blue-200">
              {classification.method}
            </span>
          </div>
        </div>
  
      </div>

      {/* Skills Analysis Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Technical Skills */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Cpu size={18} className="text-indigo-500" /> Detected Technical Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {dynamic_analysis.skills_detected.technical.map((skill, i) => (
              <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium border border-slate-200">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Gap Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" /> Critical Missing Skills
          </h3>
          <ul className="space-y-2">
            {dynamic_analysis.gap_analysis.critical_missing_skills.map((gap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                {gap}
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-slate-100">
             <div className="text-xs font-bold text-slate-400 uppercase mb-2">Recommended Learning</div>
             <div className="flex flex-wrap gap-2">
               {dynamic_analysis.gap_analysis.recommended_learning_path.map((topic, i) => (
                 <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100">{topic}</span>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Strategic Advice */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
         <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-blue-500" /> Strategic Advice
          </h3>
          <div className="space-y-3">
            {dynamic_analysis.strategic_advice.map((advice, i) => (
               <div key={i} className="flex gap-3">
                 <div className="bg-white p-1 rounded-full h-fit mt-0.5 shadow-sm">
                   <CheckCircle size={14} className="text-green-500" />
                 </div>
                 <p className="text-slate-700 text-sm leading-relaxed">{advice}</p>
               </div>
            ))}
          </div>
      </div>
    </div>
  );
};

// 4. Tools Section (Cover Letter & Job Search)
const ToolsSection = ({ file, predictedCategory }) => {
  const [jobLocation, setJobLocation] = useState("Remote");
  const [isSearching, setIsSearching] = useState(false);
  
  // Cover Letter State
  const [clData, setClData] = useState({ title: "", company: "", text: "" });
  const [generatedCL, setGeneratedCL] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleJobSearch = async () => {
    if (!file) return alert("Please upload a resume first");
    setIsSearching(true);
    
    const formData = new FormData();
    formData.append("resume_file", file);
    
    try {
      // Note: In a real app, you might just send keywords, but your API takes a file
      await axios.post(`http://localhost:8000/search_jobs_multi?location=${jobLocation}`, formData);
      alert("Browser opened on server! Check the automation window.");
    } catch (err) {
      alert("Error starting search");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateCL = async () => {
    setIsGenerating(true);
    // Note: Since we don't have the text in state from the first call easily without re-parsing,
    // we are asking user to paste text OR we could adjust backend to return text. 
    // For this demo, we assume the user pastes the text to ensure privacy control.
    try {
      const response = await axios.post("http://localhost:8000/generate_cover_letter", {
        resume_text: clData.text,
        job_title: clData.title,
        company_name: clData.company
      });
      setGeneratedCL(response.data.cover_letter);
    } catch (err) {
      alert("Error generating letter");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      
      {/* Job Search Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-orange-100 p-2 rounded-lg"><Search className="text-orange-600" size={20}/></div>
          <h3 className="font-semibold text-slate-800">Automated Job Search</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Launches a Selenium browser instance to search for <strong>{predictedCategory || "relevant"}</strong> roles.
        </p>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={jobLocation}
            onChange={(e) => setJobLocation(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Location (e.g. New York)"
          />
          <button 
            onClick={handleJobSearch}
            disabled={isSearching || !file}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {isSearching ? "Opening..." : "Launch Bot"}
          </button>
        </div>
      </div>

      {/* Cover Letter Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-purple-100 p-2 rounded-lg"><FileText className="text-purple-600" size={20}/></div>
          <h3 className="font-semibold text-slate-800">Smart Cover Letter</h3>
        </div>
        
        {!generatedCL ? (
          <div className="space-y-3">
             <input 
              placeholder="Job Title"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500"
              onChange={(e) => setClData({...clData, title: e.target.value})}
            />
            <input 
              placeholder="Company Name"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500"
              onChange={(e) => setClData({...clData, company: e.target.value})}
            />
             <textarea 
              placeholder="Paste Resume Text here for Context..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 h-20"
              onChange={(e) => setClData({...clData, text: e.target.value})}
            />
            <button 
              onClick={handleGenerateCL}
              disabled={isGenerating}
              className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              {isGenerating ? "Writing..." : "Generate Letter"}
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400">PREVIEW</span>
              <button onClick={() => setGeneratedCL("")} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>
            <p className="text-xs text-slate-600 whitespace-pre-wrap h-40 overflow-y-auto">{generatedCL}</p>
          </div>
        )}
      </div>

    </div>
  );
};

// 5. Educational Section (Why this is different)
const ConceptExplanation = () => (
  <section className="mt-12 border-t border-slate-200 pt-10 pb-20">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-slate-800">Why is this architecture "Advanced"?</h2>
      <p className="text-slate-500 mt-2">Most analyzers just send your raw PDF to OpenAI. We take a hybrid approach.</p>
    </div>

    <div className="grid md:grid-cols-3 gap-8">
      {[
        {
          title: "Local ML Classification",
          desc: "We use a TF-IDF Vectorizer + Random Forest model running locally on the server to classify your role instantly without external API calls.",
          icon: <Cpu className="text-blue-500" />
        },
        {
          title: "PII Scrubbing Layer",
          desc: "Before any data hits the LLM for analysis, a Python-based Regex scrubber removes emails, phones, and links to protect your identity.",
          icon: <ShieldCheck className="text-green-500" />
        },
        {
          title: "Selenium Automation",
          desc: "We don't just give you links. The backend spins up a real Chrome instance to open multiple job boards simultaneously with your specific context.",
          icon: <Search className="text-orange-500" />
        }
      ].map((item, i) => (
        <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-100">
          <div className="mb-4 bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm">
            {item.icon}
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

// --- MAIN APP ---
function App() {
  const [file, setFile] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (uploadedFile) => {
    setFile(uploadedFile);
    setLoading(true);
    
    const formData = new FormData();
    formData.append("resume_file", uploadedFile);

    try {
      const response = await axios.post("http://localhost:8000/comprehensive_analysis", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnalysisData(response.data);
    } catch (error) {
      console.error("Error:", error);
      alert("Analysis failed. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 pt-10">
        
        {/* Hero Section */}
        {!analysisData && !loading && (
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
              Optimize your resume for <span className="text-blue-600">Humans & Machines</span>.
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              The only analyzer that combines local ML classification with LLM-based strategic advice, all while keeping your contact info private.
            </p>
          </div>
        )}

        {/* Upload Area */}
        <div className="max-w-2xl mx-auto mb-10">
          <FileUpload onUpload={handleFileUpload} isLoading={loading} />
        </div>

        {/* Results Area */}
        {analysisData && (
          <>
            <AnalysisResults data={analysisData} />
            <ToolsSection 
              file={file} 
              predictedCategory={analysisData.classification.predicted_category} 
            />
          </>
        )}

        {/* Explanation Footer */}
        <ConceptExplanation />
        
      </main>
    </div>
  );
}

export default App;