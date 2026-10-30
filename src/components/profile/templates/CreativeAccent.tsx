
"use client"

import Image from "next/image";
import { IndianRupee } from "lucide-react";

interface TemplateProps {
  profile: any;
  photo: string;
}

export function CreativeTemplate({ profile, photo }: TemplateProps) {
  return (
    <div className="resume-container min-h-[297mm] w-[210mm] bg-white text-slate-900 font-body flex flex-col relative overflow-visible">
      <div className="h-3 bg-accent shrink-0"></div>
      
      <div className="p-10 space-y-6 flex-1 overflow-visible flex flex-col">
        <div className="flex items-center gap-8 shrink-0">
          <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-accent/10 shrink-0 shadow-sm bg-white relative">
            <Image src={photo} alt="Profile" fill className="object-cover" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-accent tracking-tighter uppercase leading-tight">
              {profile?.firstName} <span className="text-slate-900">{profile?.lastName}</span>
            </h1>
            <div className="flex flex-col gap-1.5 items-start">
              <div className="text-xs font-black bg-slate-900 text-white px-3 rounded-md tracking-widest uppercase flex items-center justify-center text-center h-[32px] leading-[32px]">
                {profile?.preferredJobTitle || "Professional"}
              </div>
              {profile?.expectedSalary && (
                <div className="flex items-center gap-1 text-accent font-black text-[10px] uppercase pt-1 leading-tight">
                  <IndianRupee className="h-2.5 w-2.5" /> {profile.expectedSalary} Expected
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 flex-1">
          <div className="space-y-5 shrink-0">
            <section className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-[10px] font-black text-accent uppercase tracking-tighter border-b border-accent/10 pb-1.5 leading-tight">Reach Me</h3>
              <div className="space-y-3 text-[10px] font-bold text-slate-500 leading-tight">
                <div className="flex flex-col gap-1"><span>Email:</span><span className="text-slate-900 break-all">{profile?.email}</span></div>
                <div className="flex flex-col gap-1"><span>Phone:</span><span className="text-slate-900">{profile?.phoneNumber}</span></div>
                <div className="flex flex-col gap-1"><span>Location:</span><span className="text-slate-900">{profile?.city}</span></div>
              </div>
            </section>

            {profile?.fatherSpouseName && (
              <section className="space-y-2 px-1">
                <h3 className="text-[10px] font-black text-accent uppercase tracking-tighter leading-tight">Personal</h3>
                <div className="space-y-1 text-[10px] font-bold leading-tight">
                  <p className="text-slate-400 uppercase tracking-tighter">F/H Name:</p>
                  <p className="text-slate-900 mb-2">{profile.fatherSpouseName}</p>
                </div>
              </section>
            )}

            <section className="space-y-3 px-1">
              <h3 className="text-[10px] font-black text-accent uppercase tracking-tighter leading-tight">Skillset</h3>
              <div className="flex flex-wrap gap-2">
                {profile?.skills?.map((s: string, i: number) => (
                  <div 
                    key={i} 
                    className="bg-accent text-white px-2 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center justify-center text-center h-[24px] leading-[24px]"
                  >
                    {s}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="col-span-2 space-y-6 border-l border-slate-100 pl-8 overflow-visible">
            <section className="space-y-2">
              <h3 className="text-[10px] font-black text-accent uppercase tracking-tighter border-b border-slate-100 pb-1.5 leading-tight">Profile Summary</h3>
              <p className="text-[11px] leading-relaxed font-medium italic text-slate-700">{profile?.resumeSummary}</p>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-accent uppercase tracking-tighter border-b border-slate-100 pb-1.5 leading-tight">Career Path</h3>
              <div className="space-y-5">
                <div className="relative pl-5 border-l border-accent/20">
                  <div className="absolute -left-[4.5px] top-1 h-2.5 w-2.5 rounded-full bg-accent border-2 border-white shadow-sm"></div>
                  <h4 className="text-base font-black text-slate-900 leading-tight">{profile?.currentDesignation}</h4>
                  <p className="text-[10px] font-black text-accent uppercase mb-2 leading-tight mt-1">{profile?.currentCompany} • {profile?.totalExperienceYears} Years EXP.</p>
                  <p className="text-[10px] leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">{profile?.experience}</p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-[10px] font-black text-accent uppercase tracking-tighter border-b border-slate-100 pb-1.5 leading-tight">Academics</h3>
              <p className="text-[10px] font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">{profile?.education}</p>
            </section>
          </div>
        </div>
      </div>

      <footer className="w-full py-4 text-center border-t bg-slate-900 shrink-0 mt-auto">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 leading-tight">
          Generated by RozgarMatrix | Modern Job Marketplace
        </p>
      </footer>
    </div>
  );
}
