
"use client"

import { Mail, Phone, MapPin, IndianRupee } from "lucide-react";

interface TemplateProps {
  profile: any;
  photo: string;
}

export function ExecutiveTemplate({ profile }: TemplateProps) {
  return (
    <div className="resume-container min-h-[297mm] w-[210mm] bg-white text-slate-800 font-body flex relative overflow-visible flex-col items-stretch">
      <div className="flex flex-1 overflow-visible items-stretch">
        <div className="w-10 bg-slate-900 shrink-0"></div>
        <div className="flex-1 p-10 space-y-6 overflow-visible flex flex-col">
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-4 shrink-0 gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <h1 className="text-4xl font-black tracking-tighter leading-tight text-slate-900">{profile?.firstName}<br/>{profile?.lastName}</h1>
              <p className="text-base font-bold text-slate-400 uppercase tracking-widest leading-tight">{profile?.preferredJobTitle || "Professional"}</p>
              {profile?.expectedSalary && (
                <p className="text-[10px] font-black text-primary uppercase tracking-widest pt-1 leading-tight flex items-center gap-1"><IndianRupee className="h-2.5 w-2.5" /> Exp. Pack: ₹{profile.expectedSalary}</p>
              )}
            </div>
            <div className="text-right space-y-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0 leading-tight pt-1">
              <p className="flex items-center justify-end gap-1.5">{profile?.email} <Mail className="h-2.5 w-2.5" /></p>
              <p className="flex items-center justify-end gap-1.5">{profile?.phoneNumber} <Phone className="h-2.5 w-2.5" /></p>
              <p className="flex items-center justify-end gap-1.5">{profile?.city} <MapPin className="h-2.5 w-2.5" /></p>
              {profile?.fullAddress && <p className="text-slate-300 max-w-[180px] leading-relaxed italic pt-1 lowercase first-letter:uppercase text-[9px] font-medium">{profile.fullAddress}</p>}
            </div>
          </div>

          <section className="space-y-1 shrink-0">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-200 leading-[1.5]">Executive Profile</h3>
            <p className="text-base font-bold leading-tight text-slate-800 tracking-tight">{profile?.resumeSummary}</p>
          </section>

          <div className="grid grid-cols-12 gap-8 flex-1 overflow-visible">
            <div className="col-span-8 space-y-6 overflow-visible">
              <section className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-200 leading-[1.5]">Career History</h3>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline h-[28px]">
                      <h4 className="text-lg font-black text-slate-900 tracking-tighter leading-[28px]">{profile?.currentDesignation}</h4>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-[28px] bg-slate-50 px-1.5 rounded">Active</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-tight">{profile?.currentCompany} • {profile?.totalExperienceYears} Years Exp.</p>
                    <p className="text-[11px] leading-relaxed text-slate-600 font-bold pt-2 whitespace-pre-wrap text-justify">{profile?.experience}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-span-4 space-y-6">
              {profile?.fatherSpouseName && (
                <section className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-200 leading-[1.5]">Personal Data</h3>
                  <div className="space-y-1.5 text-[10px] font-bold text-slate-700 uppercase leading-tight">
                    <p className="opacity-40 text-[9px] tracking-tight">F/H Name</p>
                    <p className="mb-3">{profile.fatherSpouseName}</p>
                    {profile?.dob && (
                      <>
                        <p className="opacity-40 text-[9px] tracking-tight">DOB/Age</p>
                        <p>{profile.dob}</p>
                      </>
                    )}
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-200 leading-[1.5]">Core Expertise</h3>
                <div className="flex flex-col gap-2.5 font-black text-[10px] text-slate-900 tracking-tight">
                  {profile?.skills?.slice(0, 15).map((s: string, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 border-b border-slate-50 pb-1 h-[20px] leading-[20px]">
                      <div className="h-1 w-1 bg-slate-900 rounded-full shrink-0"></div>
                      {s}
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-200 leading-[1.5]">Education</h3>
                <p className="text-[10px] font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">{profile?.education}</p>
              </section>

              {profile?.languages && (
                <section className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-200 leading-[1.5]">Languages</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile?.languages.map((l: string, i: number) => (
                      <div 
                        key={i} 
                        className="text-[10px] font-black text-slate-500 border border-slate-100 px-2 rounded flex items-center justify-center text-center h-[22px] leading-[22px] bg-slate-50"
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
          
          <div className="mt-auto pt-10 text-center border-t border-slate-100">
             <p className="text-[9px] font-black uppercase tracking-[0.6em] text-slate-200 leading-tight">
               Generated by RozgarMatrix | Modern Job Marketplace
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
