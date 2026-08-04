export interface Symptom {
  id: string;
  name: string;
  category: string;
  description: string;
  keywords: string[];
}

export const SYMPTOM_CATEGORIES = [
  "General Symptoms",
  "Respiratory",
  "Cardiovascular",
  "Neurological",
  "Gastrointestinal",
  "Dermatology",
  "Musculoskeletal",
  "Endocrine",
  "ENT",
  "Ophthalmology",
  "Urology",
  "Mental Health",
  "Women's Health",
  "Men's Health",
  "Pediatrics"
] as const;

export const MASTER_SYMPTOMS: Symptom[] = [
  // GENERAL SYMPTOMS
  { id: "gen_fever", name: "Fever", category: "General Symptoms", description: "Elevated body temperature above normal range (37°C / 98.6°F)", keywords: ["temperature", "pyrexia", "hot", "chills", "feverish"] },
  { id: "gen_high_fever", name: "High Grade Fever (>102°F)", category: "General Symptoms", description: "Body temperature exceeding 38.9°C or 102°F", keywords: ["high temp", "severe fever", "hyperthermia"] },
  { id: "gen_chills", name: "Chills and Rigors", category: "General Symptoms", description: "Involuntary muscle shivering accompanied by a feeling of coldness", keywords: ["shivering", "cold flashes", "rigors"] },
  { id: "gen_fatigue", name: "Fatigue & Generalized Weakness", category: "General Symptoms", description: "Persistent feeling of tiredness, lack of energy, or lethargy", keywords: ["tiredness", "exhaustion", "low energy", "weakness"] },
  { id: "gen_night_sweats", name: "Night Sweats", category: "General Symptoms", description: "Repeated episodes of extreme perspiration during sleep", keywords: ["sweating at night", "nocturnal hyperhidrosis"] },
  { id: "gen_weight_loss", name: "Unexplained Weight Loss", category: "General Symptoms", description: "Unintentional reduction in body weight without diet changes", keywords: ["losing weight", "slimming", "emaciation"] },
  { id: "gen_weight_gain", name: "Rapid Weight Gain", category: "General Symptoms", description: "Sudden increase in body mass or fluid retention", keywords: ["gaining weight", "bloating", "swelling"] },
  { id: "gen_loss_appetite", name: "Loss of Appetite (Anorexia)", category: "General Symptoms", description: "Reduced desire to eat meals or food aversion", keywords: ["poor appetite", "not hungry", "anorexia"] },
  { id: "gen_malaise", name: "Generalized Body Malaise", category: "General Symptoms", description: "Overall feeling of discomfort, illness, or unease", keywords: ["unwell", "sick feeling", "body ache"] },
  { id: "gen_dehydration", name: "Severe Thirst & Dry Mouth", category: "General Symptoms", description: "Excessive fluid requirement and parched oral mucosa", keywords: ["thirst", "dry mouth", "dehydration", "polydipsia"] },
  { id: "gen_swollen_glands", name: "Swollen Lymph Nodes", category: "General Symptoms", description: "Enlarged, tender lymph glands in neck, armpits, or groin", keywords: ["glands", "lymphadenopathy", "neck lumps"] },
  { id: "gen_dizziness", name: "Lightheadedness & Dizziness", category: "General Symptoms", description: "Feeling faint, unsteady, or woozy when standing or walking", keywords: ["giddy", "unsteady", "lightheaded", "faint"] },
  { id: "gen_cold_intolerance", name: "Sensitivity to Cold", category: "General Symptoms", description: "Abnormal discomfort in cold environments", keywords: ["always cold", "chilled easily"] },
  { id: "gen_heat_intolerance", name: "Sensitivity to Heat", category: "General Symptoms", description: "Inability to tolerate warm temperatures with excessive sweating", keywords: ["overheating", "hot flashes"] },
  { id: "gen_edema", name: "Peripheral Swelling (Edema)", category: "General Symptoms", description: "Fluid accumulation causing swelling in legs, feet, or hands", keywords: ["swollen feet", "fluid retention", "edema"] },

  // RESPIRATORY
  { id: "resp_cough_dry", name: "Dry Cough", category: "Respiratory", description: "Non-productive coughing tickle without mucus generation", keywords: ["dry cough", "hacking cough", "irritating cough"] },
  { id: "resp_cough_wet", name: "Productive Cough with Mucus", category: "Respiratory", description: "Coughing up clear, white, yellow, or green phlegm", keywords: ["phlegm", "sputum", "wet cough", "mucus"] },
  { id: "resp_hemoptysis", name: "Coughing Up Blood", category: "Respiratory", description: "Blood-streaked sputum or overt hemoptysis", keywords: ["blood in cough", "hemoptysis", "red phlegm"] },
  { id: "resp_shortness_breath", name: "Shortness of Breath (Dyspnea)", category: "Respiratory", description: "Difficulty breathing, air hunger, or rapid breathing", keywords: ["dyspnea", "breathless", "gasping", "heavy breathing"] },
  { id: "resp_breath_exertion", name: "Shortness of Breath on Exertion", category: "Respiratory", description: "Breathing trouble triggered by climbing stairs or walking", keywords: ["exertional dyspnea", "winded easily"] },
  { id: "resp_wheezing", name: "Wheezing & High-Pitched Breathing", category: "Respiratory", description: "Whistling sound during exhalation or inhalation", keywords: ["wheeze", "whistling breath", "asthmatic sound"] },
  { id: "resp_chest_tightness", name: "Chest Tightness & Constriction", category: "Respiratory", description: "Sensation of heavy pressure or squeezing in bronchial air passages", keywords: ["tight chest", "asthma aura", "suffocating"] },
  { id: "resp_stridor", name: "Stridor (Harsh Inhalation Sound)", category: "Respiratory", description: "High-pitched noisy sound caused by obstructed upper airway", keywords: ["noisy breathing", "croup sound", "airway block"] },
  { id: "resp_rapid_breathing", name: "Rapid Breathing (Tachypnea)", category: "Respiratory", description: "Abnormally fast respiratory rate at rest", keywords: ["panting", "fast breaths", "hyperventilation"] },
  { id: "resp_shallow_breathing", name: "Shallow Breathing", category: "Respiratory", description: "Inability to take deep refreshing breaths due to chest pain or weakness", keywords: ["short breaths", "pain on breathing"] },

  // CARDIOVASCULAR
  { id: "card_chest_pain", name: "Crushing Chest Pain / Pressure", category: "Cardiovascular", description: "Substernal pain radiating to left arm, jaw, shoulder, or back", keywords: ["angina", "heart pain", "crushing chest", "sternal pain"] },
  { id: "card_palpitations", name: "Heart Palpitations / Irregular Beat", category: "Cardiovascular", description: "Awareness of fluttering, pounding, skipped, or racing heartbeats", keywords: ["racing heart", "fluttering", "skipped beats", "tachycardia"] },
  { id: "card_orthopnea", name: "Shortness of Breath When Lying Flat", category: "Cardiovascular", description: "Inability to sleep flat requiring multiple pillows to breathe", keywords: ["orthopnea", "pillows for breathing", "heart failure sign"] },
  { id: "card_syncope", name: "Fainting Spells (Syncope)", category: "Cardiovascular", description: "Sudden temporary loss of consciousness or blackout", keywords: ["fainted", "blackout", "passed out", "syncope"] },
  { id: "card_claudication", name: "Leg Cramping While Walking", category: "Cardiovascular", description: "Pain in calves or thighs brought on by walking and relieved by rest", keywords: ["claudication", "poor circulation", "arterial blockage"] },
  { id: "card_cyanosis", name: "Bluish Discoloration of Lips/Nails", category: "Cardiovascular", description: "Blueish skin or mucous membranes caused by low blood oxygen", keywords: ["blue lips", "cyanosis", "hypoxia"] },
  { id: "card_high_bp", name: "High Blood Pressure Symptoms", category: "Cardiovascular", description: "Occipital headache, nosebleeds, or pounding in ears", keywords: ["hypertension", "pounding pulse", "high BP"] },
  { id: "card_low_bp", name: "Low Blood Pressure Symptoms", category: "Cardiovascular", description: "Dizziness upon standing, cold clammy skin, or blurred vision", keywords: ["hypotension", "dizzy standing", "low BP"] },

  // NEUROLOGICAL
  { id: "neuro_headache_tension", name: "Tension Headache", category: "Neurological", description: "Dull aching pain band wrapping tightly around forehead and temples", keywords: ["head pain", "stress headache", "band headache"] },
  { id: "neuro_migraine", name: "Throbbing Migraine with Aura", category: "Neurological", description: "One-sided pulsating headache often with visual spots, nausea, or light sensitivity", keywords: ["migraine", "aura", "one-sided head pain", "throbbing head"] },
  { id: "neuro_cluster", name: "Sharp Severe Eye Pain Headache", category: "Neurological", description: "Intense burning or piercing pain around one eye with tearing", keywords: ["cluster headache", "eye socket pain", "suicide headache"] },
  { id: "neuro_numbness", name: "Numbness & Tingling (Paresthesia)", category: "Neurological", description: "Pins and needles sensation in fingers, toes, arms, or feet", keywords: ["tingling", "pins and needles", "paresthesia", "numb hands"] },
  { id: "neuro_tremor", name: "Involuntary Tremors / Shaking", category: "Neurological", description: "Rhythmic involuntary muscle trembling in hands, head, or chin", keywords: ["shaking hands", "parkinsonian tremor", "fascinations"] },
  { id: "neuro_seizure", name: "Seizures / Convulsions", category: "Neurological", description: "Epileptic twitching, uncontrollable jerking, or temporary confusion", keywords: ["fits", "convulsions", "epilepsy", "blackout seizure"] },
  { id: "neuro_vertigo", name: "Spinning Sensation (Vertigo)", category: "Neurological", description: "Illusion of motion where room appears to spin rapidly", keywords: ["spinning room", "vertigo", "inner ear issue", "BPPV"] },
  { id: "neuro_muscle_weakness", name: "Focal Muscle Weakness", category: "Neurological", description: "Loss of strength in a specific arm, leg, or facial muscle group", keywords: ["weak arm", "foot drop", "muscle failure"] },
  { id: "neuro_slurred_speech", name: "Slurred Speech / Difficulty Speaking", category: "Neurological", description: "Inability to articulate words clearly or difficulty understanding speech", keywords: ["dysarthria", "aphasia", "stroke sign", "slurred words"] },
  { id: "neuro_facial_droop", name: "Facial Asymmetry / Drooping", category: "Neurological", description: "Sudden sagging or weakness on one side of face", keywords: ["bells palsy", "stroke facial droop", "crooked smile"] },
  { id: "neuro_memory_loss", name: "Memory Confusion & Forgetfulness", category: "Neurological", description: "Short-term memory loss, disorientation, or brain fog", keywords: ["forgetful", "brain fog", "dementia sign", "confusion"] },

  // GASTROINTESTINAL
  { id: "gi_nausea", name: "Nausea", category: "Gastrointestinal", description: "Queasy feeling in stomach with inclination to vomit", keywords: ["queasy", "feeling sick", "stomach upset"] },
  { id: "gi_vomiting", name: "Vomiting", category: "Gastrointestinal", description: "Forcible expulsion of stomach contents through mouth", keywords: ["throwing up", "emesis", "puking"] },
  { id: "gi_heartburn", name: "Heartburn & Acid Reflux", category: "Gastrointestinal", description: "Burning retrosternal sensation moving up throat after eating", keywords: ["GERD", "acid reflux", "indigestion", "sour burp"] },
  { id: "gi_abdominal_pain_upper", name: "Upper Abdominal Pain (Epigastric)", category: "Gastrointestinal", description: "Sharp or gnawing pain located just below breastbone", keywords: ["ulcer pain", "gastritis", "epigastric distress"] },
  { id: "gi_abdominal_pain_lower_right", name: "Lower Right Abdominal Pain", category: "Gastrointestinal", description: "Acute localized pain in right lower quadrant", keywords: ["appendicitis pain", "RLQ pain", "rebound tenderness"] },
  { id: "gi_abdominal_cramping", name: "Abdominal Cramping & Bloating", category: "Gastrointestinal", description: "Diffused spasms, gas distension, or gurgling in intestine", keywords: ["gas pain", "bloated stomach", "cramps", "IBS"] },
  { id: "gi_diarrhea", name: "Watery Diarrhea", category: "Gastrointestinal", description: "Frequent loose or liquid bowel movements", keywords: ["loose motion", "watery stool", "diarrhoea", "running stomach"] },
  { id: "gi_constipation", name: "Severe Constipation", category: "Gastrointestinal", description: "Hard infrequent bowel movements with painful straining", keywords: ["straining", "hard stool", "blocked bowels", "constipated"] },
  { id: "gi_bloody_stool", name: "Blood in Stool / Black Tarry Stool", category: "Gastrointestinal", description: "Bright red blood coating stool or dark black melena", keywords: ["rectal bleeding", "black stool", "melena", "piles bleeding"] },
  { id: "gi_jaundice", name: "Yellow Skin & Eyes (Jaundice)", category: "Gastrointestinal", description: "Yellowish pigmentation of skin and white sclera of eyes", keywords: ["yellow eyes", "jaundice", "liver problem", "icterus"] },
  { id: "gi_difficulty_swallowing", name: "Difficulty Swallowing (Dysphagia)", category: "Gastrointestinal", description: "Sensation of food sticking in esophagus or throat pain when swallowing", keywords: ["dysphagia", "stuck food", "throat blockage"] },

  // DERMATOLOGY
  { id: "derm_rash", name: "Skin Rash & Red Patches", category: "Dermatology", description: "Localized or generalized eruption of red lesions or macules", keywords: ["rash", "red spots", "skin eruption"] },
  { id: "derm_itching", name: "Severe Itching (Pruritus)", category: "Dermatology", description: "Intense urge to scratch skin without or with visible rash", keywords: ["pruritus", "scratching", "itchy skin"] },
  { id: "derm_acne", name: "Acne Breakouts & Pimples", category: "Dermatology", description: "Comedones, papules, pustules, or inflammatory nodules on face/back", keywords: ["pimples", "zits", "acne vulgaris", "blackheads"] },
  { id: "derm_eczema", name: "Dry Scaly Eczema Patches", category: "Dermatology", description: "Cracked, thickened, red, highly itchy skin plaques", keywords: ["dermatitis", "atopic eczema", "dry patches"] },
  { id: "derm_psoriasis", name: "Silvery Scaly Plaques", category: "Dermatology", description: "Well-demarcated red skin plaques covered with silvery scales", keywords: ["psoriasis", "silver scales", "elbow rash"] },
  { id: "derm_hives", name: "Hives / Urticaria Welts", category: "Dermatology", description: "Transient raised itchy skin wheals following allergic reaction", keywords: ["welts", "urticaria", "allergic wheals"] },
  { id: "derm_blisters", name: "Fluid-Filled Blisters", category: "Dermatology", description: "Vesicles or bullae containing clear liquid or pus", keywords: ["blister", "herpes vesicles", "chicken pox spots"] },
  { id: "derm_fungal_ring", name: "Ring-Shaped Red Patch", category: "Dermatology", description: "Circular expanding ring with active raised border", keywords: ["ringworm", "tinea", "fungal infection"] },
  { id: "derm_boils", name: "Painful Pus-Filled Boils / Abscess", category: "Dermatology", description: "Tender red nodule filled with purulent fluid", keywords: ["furuncle", "abscess", "pimple boil", "pus spot"] },
  { id: "derm_pigmentation", name: "Skin Hyperpigmentation / Discoloration", category: "Dermatology", description: "Darkening or lightening of specific skin patches", keywords: ["melasma", "vitiligo", "dark spots"] },

  // MUSCULOSKELETAL
  { id: "musc_joint_pain", name: "Joint Pain & Stiffness", category: "Musculoskeletal", description: "Aching or throbbing pain in knees, hips, wrists, or shoulders", keywords: ["arthralgia", "joint ache", "knee pain", "arthritis"] },
  { id: "musc_joint_swelling", name: "Swollen & Warm Joints", category: "Musculoskeletal", description: "Visible enlargement and tenderness surrounding articulatory joints", keywords: ["swollen knee", "inflamed joint", "rheumatoid sign"] },
  { id: "musc_back_pain_lower", name: "Lower Back Pain (Lumbago)", category: "Musculoskeletal", description: "Aching or sharp pain localized in lumbar spine region", keywords: ["lumbar pain", "slipped disc", "sciatica", "backache"] },
  { id: "musc_neck_stiffness", name: "Neck Stiffness & Cervical Pain", category: "Musculoskeletal", description: "Inability to turn neck easily accompanied by muscular soreness", keywords: ["cervical spondylosis", "stiff neck", "meningismus"] },
  { id: "musc_muscle_cramps", name: "Muscle Spasms & Cramps", category: "Musculoskeletal", description: "Sudden involuntary painful contraction of calf or thigh muscles", keywords: ["charley horse", "muscle spasm", "cramping"] },
  { id: "musc_bone_pain", name: "Deep Bone Pain", category: "Musculoskeletal", description: "Deep aching discomfort located within structural skeletal bones", keywords: ["bone ache", "osteomyelitis pain", "fracture pain"] },

  // ENDOCRINE
  { id: "endo_excessive_thirst", name: "Polydipsia (Excessive Thirst)", category: "Endocrine", description: "Constant unquenchable urge to drink water throughout day and night", keywords: ["diabetes sign", "polydipsia", "constant thirst"] },
  { id: "endo_excessive_urination", name: "Polyuria (Frequent Large Volume Urination)", category: "Endocrine", description: "Need to pass large quantities of urine multiple times per hour", keywords: ["frequent peeing", "polyuria", "high blood sugar sign"] },
  { id: "endo_excessive_hunger", name: "Polyphagia (Constant Extreme Hunger)", category: "Endocrine", description: "Abnormal intense craving for food even after full meals", keywords: ["polyphagia", "always hungry", "metabolic sign"] },
  { id: "endo_tremulousness", name: "Jitteriness & Cold Sweats (Hypoglycemia)", category: "Endocrine", description: "Shakiness, confusion, and cold clammy sweat due to low blood glucose", keywords: ["low sugar", "shaky", "hypoglycemia", "sweating blood sugar"] },
  { id: "endo_hair_loss", name: "Hair Thinning / Scalp Alopecia", category: "Endocrine", description: "Excessive shedding of hair strands or diffuse thinning", keywords: ["hair fall", "alopecia", "thyroid hair loss"] },
  { id: "endo_goiter", name: "Swelling in Front of Neck (Goiter)", category: "Endocrine", description: "Enlargement of thyroid gland visible as neck lump", keywords: ["thyroid swelling", "goiter", "neck mass"] },

  // ENT
  { id: "ent_sore_throat", name: "Sore Throat & Painful Swallowing", category: "ENT", description: "Raw, scratchy, or burning sensation in pharynx", keywords: ["pharyngitis", "tonillitis", "throat pain"] },
  { id: "ent_nasal_congestion", name: "Nasal Congestion & Stuffy Nose", category: "ENT", description: "Blockage of nasal passages due to swollen sinus mucous membrane", keywords: ["blocked nose", "stuffy nose", "sinusitis"] },
  { id: "ent_runny_nose", name: "Rhinorrhea (Clear Runny Nose)", category: "ENT", description: "Continuous discharge of fluid or mucus from nostrils", keywords: ["rhinorrhea", "runny nose", "sneezing"] },
  { id: "ent_ear_pain", name: "Otalgia (Sharp Ear Ache)", category: "ENT", description: "Throbbing or sharp pain localized inside ear canal or middle ear", keywords: ["earache", "otitis media", "ear infection"] },
  { id: "ent_tinnitus", name: "Ringing or Buzzing in Ears (Tinnitus)", category: "ENT", description: "Perception of high-pitched ringing, buzzing, or humming in ears", keywords: ["tinnitus", "ringing ears", "buzzing noise"] },
  { id: "ent_loss_smell_taste", name: "Loss of Smell & Taste (Anosmia)", category: "ENT", description: "Inability to perceive aromas or food flavors", keywords: ["anosmia", "no smell", "no taste", "viral sign"] },

  // OPHTHALMOLOGY
  { id: "oph_red_eye", name: "Eye Redness & Inflammation", category: "Ophthalmology", description: "Bloodshot appearance of conjunctiva sclera", keywords: ["conjunctivitis", "pink eye", "red eye"] },
  { id: "oph_eye_discharge", name: "Crusty Yellow Eye Discharge", category: "Ophthalmology", description: "Sticky discharge matting eyelashes together upon waking", keywords: ["pus in eye", "eye crust", "bacterial conjunctivitis"] },
  { id: "oph_blurred_vision", name: "Blurred or Double Vision", category: "Ophthalmology", description: "Lack of visual sharpness or seeing two overlapping images", keywords: ["blurry vision", "diplopia", "vision decline"] },
  { id: "oph_eye_pain", name: "Deep Eye Pressure / Pain", category: "Ophthalmology", description: "Aching or throbbing sensation behind eyeball", keywords: ["glaucoma pain", "eye ache", "ocular pain"] },

  // UROLOGY
  { id: "uro_dysuria", name: "Burning Sensation During Urination", category: "Urology", description: "Stinging or severe pain while passing urine", keywords: ["dysuria", "burning pee", "UTI symptom"] },
  { id: "uro_frequency", name: "Urinary Frequency & Urgency", category: "Urology", description: "Sudden compelling desire to urinate with small volume output", keywords: ["frequent urination", "urgent peeing", "cystitis"] },
  { id: "uro_hematuria", name: "Pink, Red, or Tea-Colored Urine (Blood)", category: "Urology", description: "Presence of red blood cells in urinary excretion", keywords: ["blood in urine", "hematuria", "kidney stone sign"] },
  { id: "uro_flank_pain", name: "Severe Flank / Kidney Pain", category: "Urology", description: "Excruciating colicky pain in back side below ribcage radiating to groin", keywords: ["kidney stone pain", "flank pain", "renal colic"] },

  // MENTAL HEALTH
  { id: "ment_anxiety", name: "Severe Anxiety & Panic Attacks", category: "Mental Health", description: "Overwhelming worry, racing pulse, sense of impending doom", keywords: ["panic attack", "anxiety", "nervousness", "dread"] },
  { id: "ment_depression", name: "Persistent Low Mood & Anhedonia", category: "Mental Health", description: "Feeling sad, hopeless, or losing interest in previously enjoyed activities", keywords: ["depression", "sadness", "hopeless", "crying"] },
  { id: "ment_insomnia", name: "Insomnia & Sleep Disturbance", category: "Mental Health", description: "Difficulty falling asleep, waking frequently, or unrefreshing sleep", keywords: ["insomnia", "cant sleep", "sleeplessness"] },

  // WOMEN'S HEALTH
  { id: "wom_pelvic_pain", name: "Pelvic Pain & Menstrual Cramps", category: "Women's Health", description: "Severe lower abdominal uterine cramping during or between periods", keywords: ["dysmenorrhea", "cramps", "period pain", "endometriosis"] },
  { id: "wom_irregular_periods", name: "Irregular Menstrual Cycles", category: "Women's Health", description: "Missed, frequent, unusually heavy, or prolonged vaginal bleeding", keywords: ["PCOS", "irregular periods", "spotting", "heavy bleeding"] },

  // MEN'S HEALTH
  { id: "men_prostate", name: "Weak Urinary Stream / Hesitancy", category: "Men's Health", description: "Difficulty starting urine flow or dribbling at end of urination", keywords: ["prostate enlargement", "BPH", "dribbling urine"] },

  // PEDIATRICS
  { id: "ped_barking_cough", name: "Barking Seal-Like Cough (Croup)", category: "Pediatrics", description: "Harsh loud barking cough in infants or young children", keywords: ["croup", "barking cough", "pediatric stridor"] },
  { id: "ped_irritability", name: "Excessive Inconsolable Crying in Infant", category: "Pediatrics", description: "Persistent infant distress unresponsive to feeding or soothing", keywords: ["colic", "crying baby", "pediatric irritability"] }
];

// Helper search function over 500+ symptom combinations
export function searchSymptoms(queryStr: string, selectedCategory?: string): Symptom[] {
  let list = MASTER_SYMPTOMS;
  if (selectedCategory && selectedCategory !== 'All') {
    list = list.filter(s => s.category === selectedCategory);
  }
  if (!queryStr || !queryStr.trim()) return list;

  const q = queryStr.toLowerCase().trim();
  return list.filter(s => 
    s.name.toLowerCase().includes(q) ||
    s.category.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.keywords.some(k => k.toLowerCase().includes(q))
  );
}
