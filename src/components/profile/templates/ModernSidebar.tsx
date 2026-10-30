
"use client"

import Image from "next/image";
import { MapPin, Mail, Phone } from "lucide-react";

interface TemplateProps {
  profile: any;
  photo: string;
}

export function ModernSidebarTemplate({ profile, photo }: TemplateProps) {
  return (
    <div className="resume-container min-h-[297mm] w-[210mm] flex bg-white text-black font-body relative overflow-visible items-stretch">
      {/* Sidebar */}
      <div className="w-1/3 bg-slate-50 p-6 border-r border-slate-200 overflow-visible flex flex-col shrink-0">
        <div className="flex-1 space-y-6">
          <div className="relative h-28 w-28 mx-auto rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white shrink-0">
            <Image src={photo} alt="Profile" fill className="object-cover" />
          </div>
          
          <section className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b-2 border-primary/20 pb-1.5 leading-tight">Contact</h3>
            <div className="space-y-2.5 text-[10px] font-bold text-slate-600 leading-tight">
              <p className="flex items-center gap-2"><Phone className="h-3 w-3 text-primary" /> {profile?.phoneNumber || "N/A"}</p>
              <p className="flex items-center gap-2"><Mail className="h-3 w-3 text-primary break-all" /> {profile?.email || "N/A"}</p>
              <p className="flex items-center gap-2"><MapPin className="h-3 w-3 text-primary" /> {profile?.city || "N/A"}</p>
              {profile?.fullAddress && (
                <p className="flex items-start gap-2 pt-2 border-t border-slate-200 mt-1 italic leading-relaxed text-[9px] font-medium">
                   {profile.fullAddress}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b-2 border-primary/20 pb-1.5 leading-tight">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile?.skills?.map((s: string, i: number) => (
                <div 
                  key={i} 
                  className="bg-primary/10 text-primary px-2 rounded-md text-[10px] font-black uppercase flex items-center justify-center text-center h-[20px] leading-[20px]"
                >
                  {s}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b-2 border-primary/20 pb-1.5 leading-tight">Languages</h3>
            <div className="flex flex-wrap gap-2">
              {profile?.languages?.map((l: string, i: number) => (
                <div 
                  key={i} 
                  className="text-[10px] font-bold text-slate-600 border border-slate-200 px-2 rounded bg-white flex items-center justify-center text-center h-[20px] leading-[20px]"
                >
                  {l}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="pt-6 pb-4 mt-auto">
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 leading-tight">
             Created on RozgarMatrix
           </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-visible flex flex-col bg-white">
        <div className="flex-1 space-y-6">
          <header className="flex flex-col gap-2 border-b-2 border-slate-900 pb-6 shrink-0">
            <h1 className="text-4xl font-black uppercase text-slate-900 tracking-tight leading-tight">{profile?.firstName} {profile?.lastName}</h1>
            <p className="text-xl font-bold text-primary tracking-wide leading-tight">{profile?.preferredJobTitle || "Professional"}</p>
          </header>

          <section className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-1 text-slate-400 leading-tight">Professional Profile</h3>
            <p className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap text-justify font-medium">{profile?.resumeSummary || "No summary provided."}</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-1 text-slate-400 leading-tight">Experience</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between font-black items-center h-[28px]">
                  <span className="text-lg text-slate-900 leading-[28px] tracking-tight">{profile?.currentDesignation || "Designation"}</span>
                  <span className="text-[10px] text-primary uppercase tracking-widest font-black bg-primary/5 px-2 rounded flex items-center justify-center text-center h-[20px] leading-[20px]">
                    Current
                  </span>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-tight">{profile?.currentCompany} • {profile?.totalExperienceYears} Years Exp.</p>
                <p className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap mt-3 text-justify font-medium">{profile?.experience || "No experience details."}</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-1 text-slate-400 leading-tight">Education</h3>
            <p className="text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap font-bold">{profile?.education || "No education details."}</p>
          </section>
        </div>

        <div className="pt-6 pb-4 mt-auto flex justify-end">
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 leading-tight">
             Modern Job Marketplace
           </p>
        </div>
      </div>
    </div>
  );
}
