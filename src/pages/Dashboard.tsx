import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Calculator, Sparkles, BrainCircuit, 
  History as HistoryIcon, Download, Trash2, Loader2, Bot, 
  ChevronRight, ArrowRight, UserCircle, Scale, Ruler, HeartPulse, MessageSquareMore
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import SymptomSelector from '@/src/components/SymptomSelector';
import PredictionResult from '@/src/components/PredictionResult';
import { cn } from '@/src/lib/utils';
import { auth, db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// BMI Categories and Tips
const BMI_INFO = [
  { range: [0, 18.5], label: "Underweight", color: "text-blue-400", tip: "Consider consulting a nutritionist to help gain weight healthily through improved calorie intake." },
  { range: [18.5, 25], label: "Normal weight", color: "text-emerald-400", tip: "Great job! Keep maintaining your current balance of diet and exercise for optimal health." },
  { range: [25, 30], label: "Overweight", color: "text-amber-400", tip: "A balanced diet and consistent moderate activity can help return your BMI to a healthy range." },
  { range: [30, 100], label: "Obese", color: "text-red-400", tip: "Medical guidance is recommended to create a sustainable weight management and cardiovascular health plan." }
];

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const FAST_MODEL = "gemini-3-flash-preview";

export default function Dashboard() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [prediction, setPrediction] = useState<any>(null);

  // Loading text cycler
  React.useEffect(() => {
    if (loading) {
      const texts = ["Analyzing Symptoms...", "Neural Processing...", "Querying Medical DB...", "Structuring Result..."];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingText(texts[i % texts.length]);
        i++;
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [loading]);
  const [activeTab, setActiveTab] = useState<'symptoms' | 'bmi' | 'chat'>('symptoms');

  // BMI State
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmiResult, setBmiResult] = useState<{ value: number, category: any } | null>(null);

  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: 'Hello! I am your AI Health Buddy. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleToggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const calculateBMI = () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w) return;
    const value = parseFloat((w / (h * h)).toFixed(1));
    const category = BMI_INFO.find(c => value >= c.range[0] && value < c.range[1]) || BMI_INFO[3];
    setBmiResult({ value, category });
  };

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) return;
    setLoading(true);
    setLoadingText("Analyzing Symptoms...");
    
    try {
      // Hyper-fast diagnostic prompt
      const prompt = `Diagnostic AI. Input: ${selectedSymptoms.join(", ")}. Return JSON: {disease, probability, risk, score, suggestions:[2], recommendations: "1 sentence"}. Priority: Speed. No formatting.`;
      
      const response = await ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          temperature: 0.1,
          systemInstruction: "Return ONLY pure JSON. Be extremely concise. High priority: SPEED."
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      setPrediction(result);

      // Save to medical history in Firestore
      const fbUser = auth.currentUser;
      const bypassUserStr = localStorage.getItem('authBypassUser');
      const bypassUser = bypassUserStr ? JSON.parse(bypassUserStr) : null;
      const activeUser = fbUser || bypassUser;

      if (activeUser) {
        await addDoc(collection(db, 'predictions'), {
          userId: activeUser.uid || activeUser.id,
          symptoms: selectedSymptoms,
          result: result,
          bmi: bmiResult,
          createdAt: serverTimestamp()
        });
      }
      
      // Keep local backup 
      const history = JSON.parse(localStorage.getItem('medicalHistory') || '[]');
      const newRecord = {
        id: `rec-${Date.now()}`,
        date: new Date().toISOString(),
        disease: result.disease || 'General Analysis',
        score: result.score || 0,
        risk: result.risk || 'Low',
        symptoms: selectedSymptoms,
        bmi: bmiResult,
        fullReport: result
      };
      localStorage.setItem('medicalHistory', JSON.stringify([newRecord, ...history]));
    } catch (error) {
      console.error("Prediction failed:", error);
      alert("AI analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const message = chatInput.trim();
    if (!message) return;
    
    const userMsg = { role: 'user', text: message };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    // Enhanced Instant replies for common health keywords and greetings
    const lowerMsg = message.toLowerCase();
    
    // Greeting triggers
    const greetings = ['hi', 'hello', 'hey', 'buddy', 'good morning', 'good afternoon', 'good evening'];
    if (greetings.some(g => lowerMsg.includes(g))) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "Hello! I'm Buddy, your health AI. How can I help you today?" }]);
      return;
    }

    // Common Health keyword triggers for instant response
    if (lowerMsg.includes('fever')) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "Fever detected. Please rest, drink plenty of fluids, and monitor your temperature." }]);
      return;
    }
    if (lowerMsg.includes('headache')) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "Headaches can be caused by stress or dehydration. Drink water and rest in a dark room." }]);
      return;
    }
    if (lowerMsg.includes('cough') || lowerMsg.includes('cold')) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "For a common cold or cough, gargle with warm salt water and stay hydrated. Consider herbal tea with honey." }]);
      return;
    }
    if (lowerMsg.includes('stomach')) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "Stomach discomfort can be due to indigestion or gas. Try ginger tea and avoid spicy foods for 24 hours." }]);
      return;
    }
    if (lowerMsg.includes('sleep') || lowerMsg.includes('tired')) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "Lack of sleep affects your immune system. Aim for 7-9 hours. Reduce blue light exposure 1 hour before bed." }]);
      return;
    }
    if (lowerMsg.includes('exercise') || lowerMsg.includes('fitness')) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "Regular exercise (30 mins a day) significantly improves heart health and mood. Keep it up!" }]);
      return;
    }
    if (lowerMsg.includes('water')) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "Hydration is key! Aim for at least 8 glasses of water a day to maintain optimal organ function." }]);
      return;
    }

    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: FAST_MODEL,
        contents: message,
        config: {
          systemInstruction: "You are Buddy, a health AI. Be ultra-concise (max 30 words). Answer fast. Prioritize speed.",
          temperature: 0.1
        }
      });
      
      setChatMessages(prev => [...prev, { role: 'bot', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { role: 'bot', text: "I'm experiencing high traffic. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const downloadReport = () => {
    if (!prediction) return;

    const sanitizedProbability = typeof prediction.probability === 'number' ? (prediction.probability > 1 ? prediction.probability / 100 : prediction.probability) : 0.85;
    const sanitizedScore = typeof prediction.score === 'number' ? prediction.score : 75;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(37, 99, 235); // brand-primary blue
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("HEALTH.AI MEDICAL REPORT", 15, 25);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 33);
    
    // Disease Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text("Diagnostic Analysis", 15, 55);
    
    autoTable(doc, {
      startY: 60,
      head: [['Category', 'Details']],
      body: [
        ['Predicted Disease', prediction.disease || 'N/A'],
        ['Probability', `${(sanitizedProbability * 100).toFixed(1)}%`],
        ['Risk Level', prediction.risk || 'N/A'],
        ['Health Score', `${sanitizedScore}/100`],
        ['Symptoms', selectedSymptoms.join(", ")],
      ],
      headStyles: { fillColor: [37, 99, 235] }, 
      theme: 'grid',
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;

    // BMI Section
    if (bmiResult) {
      doc.setFontSize(18);
      doc.text("Vitals & BMI", 15, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Metric', 'Value', 'Category']],
        body: [
          ['Height', `${height} cm`, 'N/A'],
          ['Weight', `${weight} kg`, 'N/A'],
          ['BMI Value', bmiResult.value.toString(), bmiResult.category.label],
        ],
        theme: 'striped',
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Recommendations
    doc.setFontSize(18);
    doc.text("Recommendations", 15, currentY);
    doc.setFontSize(11);
    const splitRecommendations = doc.splitTextToSize(prediction.recommendations || "No recommendations provided.", pageWidth - 30);
    doc.text(splitRecommendations, 15, currentY + 10);
    currentY += 10 + (splitRecommendations.length * 5) + 10;

    // Suggestions
    if (prediction.suggestions && prediction.suggestions.length > 0) {
      doc.setFontSize(14);
      doc.text("Key Action Items:", 15, currentY);
      prediction.suggestions.forEach((s: string, i: number) => {
        doc.text(`• ${s}`, 20, currentY + 10 + (i * 7));
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("DISCLAIMER: This report is generated by an AI assistant and should not replace professional medical advice.", 15, doc.internal.pageSize.getHeight() - 10);

    doc.save(`Health_AI_Report_${prediction.disease.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-brand-primary" />
             </div>
             <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Diagnostic AI Interface</span>
           </div>
           <h1 className="text-4xl font-black font-display tracking-tightest">Your Health <span className="text-gradient">Hub.</span></h1>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-md">
           {[ 
             { id: 'symptoms', label: 'Analysis', icon: Activity },
             { id: 'bmi', label: 'BMI Tool', icon: Calculator },
             { id: 'chat', label: 'Chatbot', icon: Bot }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={cn(
                 "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all duration-300",
                 activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-white/40 hover:text-white/60 hover:bg-white/5"
               )}
             >
               <tab.icon className="w-3.5 h-3.5" />
               {tab.label.toUpperCase()}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-4 h-full flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {activeTab === 'symptoms' && (
              <motion.div
                key="symptoms"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card flex-1 flex flex-col min-h-[600px]"
              >
                <SymptomSelector 
                  selected={selectedSymptoms} 
                  onToggle={handleToggleSymptom}
                  onClear={() => setSelectedSymptoms([])} 
                />
                <div className="p-6 bg-white/[0.02] border-t border-white/5">
                   <button 
                     disabled={selectedSymptoms.length === 0 || loading}
                     onClick={handlePredict}
                     className="w-full btn-primary py-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed group shadow-2xl shadow-brand-primary/20"
                   >
                     {loading ? (
                       <>
                         <Loader2 className="w-5 h-5 animate-spin" /> 
                         {loadingText}
                       </>
                     ) : (
                       <>
                         Run AI Diagnostic
                         <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                       </>
                     )}
                   </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'bmi' && (
              <motion.div
                key="bmi"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-emerald-500/5 backdrop-blur-lg border border-emerald-500/20 rounded-2xl p-8 min-h-[600px]"
              >
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                   <div>
                     <h2 className="text-xl font-bold text-emerald-400">BMI CALCULATOR</h2>
                     <p className="text-emerald-500/40 text-[10px] font-bold uppercase tracking-widest leading-none">Body mass index tool</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1 flex items-center gap-2">
                        <Ruler className="w-3 h-3 text-brand-primary" /> Height (cm)
                      </label>
                      <input 
                        type="number" 
                        placeholder="e.g. 175"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-white/10 text-xl font-bold"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1 flex items-center gap-2">
                        <Scale className="w-3 h-3 text-brand-primary" /> Weight (kg)
                      </label>
                      <input 
                        type="number" 
                        placeholder="e.g. 70"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-white/10 text-xl font-bold"
                      />
                   </div>

                   <button 
                    onClick={calculateBMI}
                    className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                   >
                     Calculate Vitals
                   </button>

                   {bmiResult && (
                     <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="mt-8 p-6 rounded-3xl bg-white/5 border border-white/5 text-center"
                     >
                        <div className="text-[10px] uppercase font-black tracking-widest text-white/20 mb-1 leading-none">Your Body Index</div>
                        <div className="text-6xl font-black font-display text-emerald-400 mb-2">{bmiResult.value}</div>
                        <div className={cn("text-xs font-black uppercase tracking-widest mb-4", bmiResult.category.color)}>
                          {bmiResult.category.label}
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.03] text-[11px] text-white/60 leading-relaxed italic">
                          "{bmiResult.category.tip}"
                        </div>
                     </motion.div>
                   )}
                </div>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-8 min-h-[600px] flex flex-col"
              >
                 <div className="flex items-center gap-3 mb-8">
                   <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-brand-accent" />
                   </div>
                   <div>
                     <h2 className="text-xl font-bold">Health Buddy</h2>
                     <p className="text-white/40 text-xs">AI Medical Consultant Available 24/7</p>
                   </div>
                </div>
                               <div className="flex-1 overflow-y-auto space-y-4 mb-6 p-4 bg-white/[0.02] border border-white/5 rounded-3xl custom-scrollbar min-h-[300px]">
                   {chatMessages.map((msg, i) => (
                     <div key={i} className={cn(
                       "flex w-full",
                       msg.role === 'user' ? "justify-end" : "justify-start"
                     )}>
                       <div className={cn(
                         "max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed",
                         msg.role === 'user' 
                           ? "bg-brand-accent text-black font-bold rounded-tr-none" 
                           : "bg-white/5 border border-white/5 text-white/60 rounded-tl-none"
                       )}>
                         {msg.text}
                       </div>
                     </div>
                   ))}
                   {isTyping && (
                     <div className="flex justify-start">
                        <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1">
                           <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce" />
                           <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                           <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                     </div>
                   )}
                </div>

                <div className="relative">
                   <input 
                     type="text" 
                     placeholder="Type your question..."
                     value={chatInput}
                     onChange={(e) => setChatInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                     className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-6 pr-12 focus:ring-2 focus:ring-brand-accent outline-none font-medium placeholder:text-white/20"
                   />
                   <button 
                     onClick={handleSendMessage}
                     disabled={isTyping}
                     className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center text-black shadow-lg shadow-brand-accent/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                   >
                      <ArrowRight className="w-5 h-5" />
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Prediction Results */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {prediction ? (
              <motion.div
                key="prediction-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <PredictionResult data={prediction} onDownload={downloadReport} />
              </motion.div>
            ) : (
              <motion.div
                key="empty-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card h-[600px] flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-primary/20 blur-[60px] animate-pulse" />
                  <HeartPulse className="w-32 h-32 text-brand-primary/20 relative z-10 mb-8" />
                </div>
                <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Awaiting Input</h2>
                <p className="text-white/40 max-w-sm mb-8 leading-relaxed">
                  Select your current symptoms from the left panel to begin our detailed multi-model AI analysis.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                   {["Heart health", "Diabetes check", "Liver function", "Kidney screen"].map(tag => (
                     <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white/20 tracking-widest">{tag}</span>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
