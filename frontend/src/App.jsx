import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Upload, FileText, Search, ShieldCheck, 
  Cpu, Briefcase, ChevronRight, CheckCircle, 
  AlertTriangle, X, Loader2, Sparkles, 
  Brain, Zap, Lock, Globe, TrendingUp,
  Award, Target, Code, Database, Cloud,
  Shield, Cpu as Chip, Rocket, Eye, BarChart3
} from 'lucide-react';
import { jsPDF } from "jspdf"; // Import jsPDF at the top

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-white/90 backdrop-blur-xl shadow-soft-lg py-3' 
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl blur-md opacity-70"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
                <Brain className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent tracking-tight">
                ResumeAI<span className="text-blue-500">.Pro</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" /> Privacy-First • AI-Powered • Real-time Analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full text-sm font-medium text-green-700 border border-green-100">
                <Lock className="w-3.5 h-3.5" /> PII Scrubbing Active
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full text-sm font-medium text-purple-700 border border-purple-100">
                <Zap className="w-3.5 h-3.5" /> Llama-3 Powered
              </span>
            </div>
          
          </div>
        </div>
      </div>
    </header>
  );
};

// 2. Advanced File Upload with Particle Effect
const FileUpload = ({ onUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (dragActive) {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 20 + 10,
        duration: Math.random() * 2 + 1
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [dragActive]);

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
    <div className="relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-transparent rounded-3xl blur-xl"></div>
      
      {/* Floating Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-blue-200/20 to-purple-200/20 animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${particle.duration}s`
          }}
        />
      ))}

      <div 
        className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-500 ${
          dragActive 
            ? "border-blue-400 bg-gradient-to-br from-blue-50/80 to-purple-50/60 shadow-2xl shadow-blue-500/10 transform scale-[1.02]" 
            : "border-slate-300/50 bg-white/70 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/5"
        }`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])}
          accept=".pdf,.doc,.docx"
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Animated Upload Icon */}
          <div className="relative">
            {isLoading ? (
              <>
                <div className="absolute inset-0 animate-ping bg-blue-400/30 rounded-full"></div>
                <div className="relative animate-spin text-blue-600">
                  <Loader2 size={64} />
                </div>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-6 rounded-2xl shadow-lg">
                  <Upload size={40} className="text-white" />
                </div>
                <div className="absolute -top-2 -right-2 bg-white p-2 rounded-full shadow-lg border">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                </div>
              </>
            )}
          </div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-slate-800">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">Analyzing Resume</span>
                  <Sparkles className="w-5 h-5 text-yellow-500 animate-bounce" />
                </span>
              ) : "Drop Resume PDF Here"}
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              {isLoading 
                ? "Running Local ML Classification & LLM Gap Analysis"
                : "Secure, private analysis with real-time insights. We scrub all personal data before processing."}
            </p>
          </div>
          
          {!isLoading && (
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Secure</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Private</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> AI-Powered</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. Advanced Analysis Results Dashboard
const AnalysisResults = ({ data }) => {
  if (!data) return null;

  const { classification, dynamic_analysis } = data;
  const confidence = parseFloat(classification.confidence_score);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Role Prediction Card with Glow Effect */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 shadow-lg">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-2.5 rounded-xl">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">AI-PREDICTED ROLE</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-700 bg-clip-text text-transparent">
                {classification.predicted_category}
              </h2>
              <p className="text-slate-500 mt-2">{classification.method} • {classification.details}</p>
            </div>
            
    
          </div>
        </div>
      </div>

      {/* Skills & Gap Analysis Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Technical Skills Card */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 p-2 rounded-lg">
                <Chip className="w-5 h-5 text-indigo-600" />
              </div>
              Detected Technical Skills
            </h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {dynamic_analysis.skills_detected.technical.length} Skills
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {dynamic_analysis.skills_detected.technical.map((skill, i) => (
              <span 
                key={i}
                className="group relative px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-white text-indigo-700 rounded-xl text-sm font-semibold border border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 cursor-pointer"
              >
                {skill}
                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  +
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Gap Analysis Card */}
        <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/60 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-6">
            <div className="bg-gradient-to-br from-amber-100 to-amber-50 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            Critical Skill Gaps
          </h3>
          <ul className="space-y-4">
            {dynamic_analysis.gap_analysis.critical_missing_skills.slice(0, 3).map((gap, i) => (
              <li key={i} className="flex items-start gap-3 p-3 bg-white/50 rounded-xl border border-amber-100">
                <div className="bg-amber-100 p-1.5 rounded-lg">
                  <X className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-800">{gap}</span>
                  <p className="text-xs text-slate-500 mt-1">High impact on market value</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Strategic Advice Card */}
      <div className="relative overflow-hidden rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="relative bg-white/90 backdrop-blur-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2.5 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">AI-Generated Strategic Advice</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {dynamic_analysis.strategic_advice.map((advice, i) => (
              <div 
                key={i}
                className="group bg-gradient-to-br from-slate-50/50 to-white p-5 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{advice}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs font-medium text-blue-600">Priority: {i === 0 ? 'High' : 'Medium'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


const ToolsSection = ({ file, predictedCategory }) => {
  const [jobLocation, setJobLocation] = useState("Remote");
  const [isSearching, setIsSearching] = useState(false);
  const [clData, setClData] = useState({ title: "", company: "", text: "" });
  const [generatedCL, setGeneratedCL] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTool, setActiveTool] = useState(null);

  // --- NEW FUNCTIONALITIES ---

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCL);
      alert("Cover letter copied to clipboard!");
    } catch (err) {
      alert("Failed to copy text.");
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // PDF Styling & Formatting
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = pageWidth - (margin * 2);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Cover Letter", margin, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    // Split text to fit page width
    const splitText = doc.splitTextToSize(generatedCL, textWidth);
    doc.text(splitText, margin, 40);
    
    doc.save(`${clData.company || 'Cover_Letter'}_ResumeAI.pdf`);
  };

  // --- EXISTING LOGIC ---
  const handleJobSearch = async () => {
    if (!file) return alert("Please upload a resume first");
    setIsSearching(true);
    setActiveTool('job-search');
    
    setTimeout(async () => {
      const formData = new FormData();
      formData.append("resume_file", file);
      try {
        await axios.post(`http://localhost:8000/search_jobs_multi?location=${jobLocation}`, formData);
        alert("Browser automation launched!");
      } catch (err) {
        alert("Error starting search");
      } finally {
        setIsSearching(false);
        setActiveTool(null);
      }
    }, 1000);
  };

  const handleGenerateCL = async () => {
    setIsGenerating(true);
    setActiveTool('cover-letter');
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
      setActiveTool(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* ... previous UI code for Job Search remains the same ... */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-slate-800">AI-Powered Career Tools</h3>
        <p className="text-slate-500 mt-2">Automated solutions to accelerate your job search</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Job Search Card with Interactive Map */}
        <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 ${
          activeTool === 'job-search' 
            ? 'border-blue-400 shadow-2xl shadow-blue-500/20' 
            : 'border-slate-200/50 hover:border-blue-200 hover:shadow-xl'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 to-yellow-50/20"></div>
          <div className="relative p-7">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-orange-500 to-yellow-500 p-3 rounded-xl shadow-lg">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">Smart Job Search</h4>
                  <p className="text-sm text-slate-500">Automated browser automation</p>
                </div>
              </div>
              <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                LIVE
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-white/50 p-4 rounded-xl border border-slate-100">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Target Location</label>
                <div className="flex gap-3">
                  {["Remote", "Hybrid", "On-site"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setJobLocation(type)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        jobLocation === type
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  placeholder="Enter location..."
                  className="flex-1 bg-white/70 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  onClick={handleJobSearch}
                  disabled={isSearching || !file}
                  className="px-6 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 transition-all duration-300 flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Launch Bot
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Cover Letter Generator Section */}
      <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 ${
        activeTool === 'cover-letter' ? 'border-purple-400 shadow-2xl shadow-purple-500/20' : 'border-slate-200/50 hover:border-purple-200 hover:shadow-xl'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-pink-50/20"></div>
        <div className="relative p-7">
          {/* Header Icon & Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-800">AI Cover Letter</h4>
              <p className="text-sm text-slate-500">Context-aware generation</p>
            </div>
          </div>

          {!generatedCL ? (
            <div className="space-y-4">
               {/* Form Inputs remain the same */}
               <input placeholder="Job Title" className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50" onChange={(e) => setClData({...clData, title: e.target.value})} />
               <input placeholder="Company Name" className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50" onChange={(e) => setClData({...clData, company: e.target.value})} />
               <textarea placeholder="Paste resume text..." className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-3 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-purple-500/50" onChange={(e) => setClData({...clData, text: e.target.value})} />
               <button onClick={handleGenerateCL} disabled={isGenerating} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg">
                 {isGenerating ? "AI is writing..." : "Generate Smart Letter"}
               </button>
            </div>
          ) : (
            <div className="bg-white/70 rounded-xl border border-slate-200 p-5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">AI-Generated Letter</span>
                <button onClick={() => setGeneratedCL("")} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed max-h-60 overflow-y-auto pr-2 whitespace-pre-wrap">
                {generatedCL}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                {/* ATTACHED FUNCTIONS HERE */}
                <button 
                  onClick={handleCopy}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  Copy Text
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TechStackVisualization = () => (
  <div className="py-20">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-slate-900 mb-3">Advanced Architecture</h2>
      <p className="text-slate-500 max-w-2xl mx-auto">
        A sophisticated multi-layered system combining local ML, privacy-first processing, and real-time automation
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-8 mb-12">
      {[
        {
          title: "Local ML Engine",
          description: "TF-IDF Vectorizer with Random Forest classification running locally for instant role prediction",
          icon: <Database className="w-8 h-8 text-blue-500" />,
          features: ["No API Calls", "Real-time", "95% Accuracy"],
          color: "blue"
        },
        {
          title: "Privacy Layer",
          description: "Advanced Regex-based PII scrubbing removes all personal identifiers before any data leaves",
          icon: <Shield className="w-8 h-8 text-green-500" />,
          features: ["GDPR Compliant", "Real-time Scrubbing", "Audit Logs"],
          color: "green"
        },
        {
          title: "LLM Integration",
          description: "Llama-3 powered strategic analysis with context-aware recommendations",
          icon: <Brain className="w-8 h-8 text-purple-500" />,
          features: ["Dynamic Analysis", "Personalized Advice", "Market Insights"],
          color: "purple"
        }
      ].map((tech, i) => (
        <div 
          key={i}
          className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-7 border border-slate-200/50 hover:border-slate-300 transition-all duration-500 hover:shadow-xl"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className={`bg-gradient-to-br from-${tech.color}-100 to-${tech.color}-50 p-3.5 rounded-xl`}>
              {tech.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-800">{tech.title}</h3>
          </div>
          <p className="text-slate-600 mb-6 leading-relaxed">{tech.description}</p>
          <div className="flex flex-wrap gap-2">
            {tech.features.map((feature, j) => (
              <span key={j} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                {feature}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Automation Features */}
    <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-10 text-white">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h3 className="text-2xl font-bold mb-4">Real Browser Automation</h3>
          <p className="text-slate-300 mb-6">
            Selenium-powered automation that launches real Chrome instances to search across multiple job boards simultaneously.
          </p>
          <div className="space-y-4">
            {["LinkedIn", "Indeed", "Glassdoor", "AngelList"].map((platform, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-medium">Automated search on {platform}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
          <div className="relative bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-blue-400" />
              <span className="font-bold">Live Automation Dashboard</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Active Browsers</span>
                <span className="font-bold">4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Jobs Found</span>
                <span className="font-bold">127</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Automation Time</span>
                <span className="font-bold">24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- MAIN APP ---
function App() {
  const [file, setFile] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showParticles, setShowParticles] = useState(true);

  const handleFileUpload = async (uploadedFile) => {
    setFile(uploadedFile);
    setLoading(true);
    setShowParticles(false);
    
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans text-slate-900">
      <Header />
      
      {/* Animated Background Particles */}
      {showParticles && (
        <div className="fixed inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-blue-200/10 to-purple-200/10 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                animationDuration: `${Math.random() * 10 + 10}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      )}

      <main className="relative pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Hero Section */}
          {!analysisData && !loading && (
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                <span className="bg-gradient-to-r from-slate-900 via-blue-700 to-purple-600 bg-clip-text text-transparent">
                  AI-Powered Resume
                </span>
                <br />
                <span className="text-slate-700">Analysis Platform</span>
              </h1>
              <p className="text-xl text-slate-500 mb-10 leading-relaxed">
                Advanced ML classification meets privacy-first processing. Get actionable insights 
                without compromising your personal data.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <Zap className="w-4 h-4 inline mr-2" /> Real-time Analysis
                </span>
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4 inline mr-2" /> PII Protection
                </span>
                <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  <Brain className="w-4 h-4 inline mr-2" /> AI Recommendations
                </span>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="mb-16">
            <FileUpload onUpload={handleFileUpload} isLoading={loading} />
          </div>

          {/* Results Section */}
          {analysisData && (
            <div className="space-y-16">
              <AnalysisResults data={analysisData} />
              <ToolsSection 
                file={file} 
                predictedCategory={analysisData.classification.predicted_category} 
              />
            </div>
          )}

          {/* Tech Stack Visualization */}
          <TechStackVisualization />

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-6 h-6 text-blue-400" />
                <span className="text-xl font-bold">ResumeAI.Pro</span>
              </div>
              <p className="text-slate-400 text-sm">
                Advanced AI resume analyzer for the privacy-conscious professional.
              </p>
            </div>
            {["Product", "Technology", "Resources", "Company"].map((section) => (
              <div key={section}>
                <h4 className="font-bold mb-4 text-slate-300">{section}</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  {["Feature 1", "Feature 2", "Feature 3"].map((item) => (
                    <li key={item} className="hover:text-white cursor-pointer transition-colors">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            © 2024 ResumeAI.Pro - Final Year Project | Advanced AI Resume Analysis System
          </div>
        </div>
      </footer>
    </div>
  );
}

// Add custom animations to global styles
const styles = `
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

@keyframes glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}

.shadow-soft-lg {
  box-shadow: 0 10px 40px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.03);
}

.shadow-soft-xl {
  box-shadow: 0 20px 60px rgba(0,0,0,0.1), 0 5px 20px rgba(0,0,0,0.05);
}

.bg-gradient-soft {
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%);
}

.border-soft {
  border: 1px solid rgba(255,255,255,0.2);
}

.animate-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// Add styles to document head
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default App;