import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, Circle, X, ChevronRight, Download, Database, Filter, Info } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { MASTER_SYMPTOMS_2000, KAGGLE_DATASET_STATS, Symptom } from '@/src/data/symptoms_library';

interface Props {
  selected: string[];
  onToggle: (symptom: string) => void;
  onClear: () => void;
}

const QUICK_CATEGORIES = [
  "All",
  "General & Systemic",
  "Respiratory",
  "Cardiovascular",
  "Gastrointestinal",
  "Neurological",
  "Dermatological",
  "Musculoskeletal",
  "Endocrine",
  "Renal & Urological",
  "Otolaryngology & ENT",
  "Ophthalmology",
  "Psychiatric",
  "Immunological"
];

export default function SymptomSelector({ selected, onToggle, onClear }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [limit, setLimit] = useState(25);
  const [showDatasetInfo, setShowDatasetInfo] = useState(false);

  const filtered = useMemo(() => {
    let result = MASTER_SYMPTOMS_2000;
    
    if (activeCategory !== "All") {
      const catLower = activeCategory.toLowerCase();
      result = result.filter(s => 
        s.category.toLowerCase().includes(catLower) || 
        s.bodySystem.toLowerCase().includes(catLower)
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.medicalTerm.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.aliases.some(a => a.toLowerCase().includes(q))
      );
    }

    return result;
  }, [search, activeCategory]);

  const displayed = useMemo(() => {
    return filtered.slice(0, limit);
  }, [filtered, limit]);

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 space-y-3 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Clinical Symptom Matrix
              </h3>
              <p className="text-[11px] text-white/50">
                {MASTER_SYMPTOMS_2000.length.toLocaleString()} verified symptoms from Kaggle & Columbia Medical CSV
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDatasetInfo(!showDatasetInfo)}
            className={cn(
              "text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-medium",
              showDatasetInfo 
                ? "bg-brand-primary/20 border-brand-primary/40 text-brand-primary" 
                : "bg-white/5 border-white/10 text-white/60 hover:text-white"
            )}
          >
            <Info className="w-3.5 h-3.5" />
            Dataset CSVs
          </button>
        </div>

        {/* Dataset Info Drawer */}
        {showDatasetInfo && (
          <div className="p-3.5 rounded-xl bg-brand-primary/5 border border-brand-primary/20 text-xs space-y-2.5 animate-in fade-in-50">
            <div className="flex items-center justify-between text-white/80 font-medium">
              <span>Local Dataset Folder: <code className="text-brand-primary bg-black/40 px-1.5 py-0.5 rounded">/datasets/kaggle_medical_500plus/</code></span>
              <span className="text-[10px] text-white/40">555 Diseases | 2,230 Symptoms</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="/api/datasets/download/diseases_500_plus.csv"
                download="diseases_500_plus.csv"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/5 hover:bg-brand-primary/20 border border-white/10 text-[11px] font-semibold text-white transition-all"
              >
                <Download className="w-3.5 h-3.5 text-brand-primary" />
                Download 555 Diseases CSV
              </a>
              <a
                href="/api/datasets/download/symptoms_2000_plus.csv"
                download="symptoms_2000_plus.csv"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/5 hover:bg-brand-primary/20 border border-white/10 text-[11px] font-semibold text-white transition-all"
              >
                <Download className="w-3.5 h-3.5 text-brand-primary" />
                Download 2,230 Symptoms CSV
              </a>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder={`Search across ${MASTER_SYMPTOMS_2000.length} symptoms (e.g. fever, headache, palpitations, chest pain)...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLimit(25);
            }}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          {QUICK_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setLimit(25);
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all text-[11px]",
                activeCategory === cat
                  ? "bg-brand-primary text-slate-950 font-bold shadow-md shadow-brand-primary/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Symptom List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar max-h-[420px]">
        {displayed.map((s) => {
          const isSelected = selected.includes(s.name);
          return (
            <button
              key={s.id}
              onClick={() => onToggle(s.name)}
              className={cn(
                "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left group",
                isSelected
                  ? "bg-brand-primary/15 border-brand-primary/50 text-white shadow-sm"
                  : "bg-white/[0.02] border-white/5 text-white/70 hover:bg-white/[0.06] hover:border-white/10"
              )}
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-semibold truncate", isSelected ? "text-brand-primary" : "text-white")}>
                    {s.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/5 font-mono">
                    {s.bodySystem || s.category.split('&')[0].trim()}
                  </span>
                  {s.urgency === 'Critical' && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/40 truncate mt-0.5">
                  {s.medicalTerm} • {s.description}
                </p>
              </div>

              {isSelected ? (
                <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0 animate-in zoom-in-50" />
              ) : (
                <Circle className="w-4 h-4 text-white/20 group-hover:text-white/40 shrink-0 transition-colors" />
              )}
            </button>
          );
        })}

        {limit < filtered.length && (
          <button
            onClick={() => setLimit(prev => prev + 35)}
            className="w-full py-3 mt-2 rounded-xl bg-white/5 hover:bg-brand-primary/10 border border-dashed border-white/10 hover:border-brand-primary/30 text-xs font-medium text-brand-primary transition-all flex items-center justify-center gap-1.5"
          >
            Load More Symptoms ({filtered.length - limit} remaining in filter)
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-white/40 text-xs space-y-1">
            <p className="font-semibold text-white/60">No symptoms found for "{search}"</p>
            <p>Try searching another medical term or select "All" categories.</p>
          </div>
        )}
      </div>

      {/* Selected Symptoms Tray */}
      {selected.length > 0 && (
        <div className="p-3 bg-slate-950/80 border-t border-white/10 backdrop-blur-md space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white/60 uppercase tracking-wider text-[10px]">
              Active Symptoms ({selected.length})
            </span>
            <button
              onClick={onClear}
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
            {selected.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-primary/20 border border-brand-primary/30 text-brand-primary text-[11px] font-medium"
              >
                {s}
                <button
                  onClick={() => onToggle(s)}
                  className="hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
