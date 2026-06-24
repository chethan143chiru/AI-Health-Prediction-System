import React from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, User, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import creatorImage from '../assets/images/creator_chethan_headshot_1780392097205.png';

export default function Contact() {
  const team = [
    {
      role: "Project Visionary",
      name: "Chethan",
      phone: "9900399845",
      city: "Pandavapura",
      email: "contact@health.ai",
      image: creatorImage
    },
    {
      role: "AI & Research Visionary",
      name: "Chinmai",
      phone: "9591534039",
      city: "Pandavapura",
      email: "chinmaicj@gmail.com",
      image: "https://picsum.photos/seed/chinmai/200/200"
    },
    {
      role: "Full-Stack Developer",
      name: "Inchara",
      phone: "6362463859",
      city: "Mysuru",
      email: "incharar3007@gmail.com",
      image: "https://picsum.photos/seed/inchara/200/200"
    },
    {
      role: "UI/UX Designer & Quality Analyst",
      name: "Jyothi",
      phone: "7619587172",
      city: "Bangalore",
      email: "jyothik@gmail.com",
      image: "https://picsum.photos/seed/jyothi/200/200"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col items-center mb-16 text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-medium"
        >
          <Phone className="w-4 h-4" />
          <span>Get in Touch</span>
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black mb-6">Our <span className="text-gradient">Team.</span></h1>
        <p className="text-white/40 max-w-xl">Meet the visionaries behind the AI Health Prediction System.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {team.map((member, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 group"
          >
            <div className="relative mb-6">
              <img 
                src={member.image} 
                alt={member.role} 
                className="w-full h-48 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl text-xs font-bold uppercase tracking-widest text-brand-primary border border-white/10">
                {member.role}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold">{member.name}</h3>
              <div className="space-y-3 text-white/60 text-sm">
                <a href={`tel:${member.phone}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-brand-primary/10 transition-all cursor-pointer">
                  <Phone className="w-4 h-4 text-brand-primary" /> 
                  <span>{member.phone}</span>
                </a>
                <a href={`mailto:${member.email}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-brand-primary/10 transition-all cursor-pointer">
                  <Mail className="w-4 h-4 text-brand-primary" /> 
                  <span>{member.email}</span>
                </a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(member.city)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-brand-primary/10 transition-all cursor-pointer">
                  <MapPin className="w-4 h-4 text-brand-primary" /> 
                  <span>{member.city}</span>
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
