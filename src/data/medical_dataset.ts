/**
 * Project Dataset Information
 * 
 * Target Dataset: Disease Symptom Prediction Dataset
 * Source Citation: 
 * 1. Kaggle - "Symptom-2-Disease Dataset" or "Disease Prediction from Symptoms"
 * 2. UCI Machine Learning Repository
 * 
 * Scope: 41 diseases with 132 unique symptoms.
 * 
 * Integration: 
 * The diagnostic engine uses a hybrid approach. It leverages the historical 
 * accuracy of these datasets combined with the real-time reasoning of 
 * Gemini 3.1 Flash for edge-case interpretation.
 */

export const MEDICAL_DATASET_INFO = {
  name: "Combined Clinical Symptom-Disease Dataset",
  origin: "Research compilation from Kaggle & UCI ML Repository",
  size: "4,920 records curated from 41 disease profiles",
  symptoms: [
    "Abdominal pain", "Acidity", "Anxiety", "Back pain", "Bladder irritation", 
    "Breathlessness", "Chest pain", "Chills", "Cough", "Depression", "Diarrhoea", 
    "Dizziness", "Fatigue", "Fever", "Headache", "Indigestion", "Itching", 
    "Joint pain", "Lethargy", "Muscle pain", "Nausea", "Obesity", "Restlessness", 
    "Skin rash", "Sweating", "Vomiting", "Weight loss"
  ],
  diseasesCovered: [
    "Fungal infection", "Allergy", "GERD", "Chronic cholestasis", "Drug Reaction",
    "Peptic ulcer diseae", "AIDS", "Diabetes", "Gastroenteritis", "Bronchial Asthma",
    "Hypertension", "Migraine", "Cervical spondylosis", "Paralysis (brain hemorrhage)",
    "Jaundice", "Malaria", "Chicken pox", "Dengue", "Typhoid", "hepatitis A",
    "Hepatitis B", "Hepatitis C", "Hepatitis D", "Hepatitis E", "Alcoholic hepatitis",
    "Tuberculosis", "Common Cold", "Pneumonia", "Dimorphic hemmorhoids(piles)",
    "Heart attack", "Varicose veins", "Hypothyroidism", "Hyperthyroidism",
    "Hypoglycemia", "Osteoarthristis", "Arthritis", "(vertigo) Paroymsal  Positional Vertigo",
    "Acne", "Urinary tract infection", "Psoriasis", "Impetigo"
  ]
};
